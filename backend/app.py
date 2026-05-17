from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import calendar
import csv
import io
import random

# 1. Configuration
import os
app = Flask(__name__)
CORS(app)

if os.environ.get('VERCEL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/finance.db'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 2. Database Model
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(20), nullable=False)

with app.app_context():
    db.create_all()

# 3. Routes
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    # FIX: Sort by Date DESC, then by ID DESC (So new entries appear top)
    transactions = Transaction.query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()
    output = []
    for t in transactions:
        output.append({
            'id': t.id, 'title': t.title, 'amount': t.amount,
            'type': t.type, 'category': t.category, 'date': t.date
        })
    return jsonify(output)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    new_transaction = Transaction(
        title=data['title'], amount=float(data['amount']),
        type=data['type'], category=data['category'], date=data['date']
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify({'message': 'Added successfully'})

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

@app.route('/api/predict', methods=['GET'])
def predict_spending():
    today = datetime.now()
    current_day = today.day
    _, days_in_month = calendar.monthrange(today.year, today.month)
    expenses = Transaction.query.filter_by(type='expense').all()
    total_spent = sum(t.amount for t in expenses)
    day_divisor = current_day if current_day > 0 else 1
    daily_average = total_spent / day_divisor
    predicted_total = daily_average * days_in_month
    return jsonify({
        'current_day': current_day, 'days_in_month': days_in_month,
        'predicted_total': predicted_total
    })

@app.route('/api/health', methods=['GET'])
def health_score():
    incomes = Transaction.query.filter_by(type='income').all()
    expenses = Transaction.query.filter_by(type='expense').all()
    total_income = sum(t.amount for t in incomes)
    total_expense = sum(t.amount for t in expenses)
    score = 100
    tips = []
    if total_income == 0: return jsonify({'score': 0, 'tips': ["Add income to calculate score."]})
    savings_rate = ((total_income - total_expense) / total_income) * 100
    if savings_rate < 10: 
        score -= 40
        tips.append("⚠️ Critical: You are saving less than 10%.")
    elif savings_rate < 30:
        score -= 20
        tips.append("📉 Try to increase savings to 30%.")
    if expenses:
        max_expense = max(expenses, key=lambda x: x.amount)
        if max_expense.amount > (total_income * 0.4):
            score -= 15
            tips.append(f"🚨 Huge spend on {max_expense.title}. Be careful.")
    return jsonify({'score': max(int(score), 0), 'tips': tips if tips else ["✅ Financial health is excellent!"]})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({'error': 'No selected file'}), 400
    if file:
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.reader(stream)
        next(csv_input, None) 
        count = 0
        for row in csv_input:
            if len(row) >= 3:
                title_lower = row[0].lower()
                cat = "Others"
                if "food" in title_lower or "coffee" in title_lower or "grocery" in title_lower or "zomato" in title_lower: cat = "Food"
                elif "uber" in title_lower or "metro" in title_lower or "fuel" in title_lower: cat = "Transport"
                elif "rent" in title_lower or "house" in title_lower: cat = "Housing"
                elif "netflix" in title_lower or "spotify" in title_lower or "movie" in title_lower: cat = "Entertainment"
                elif "stipend" in title_lower or "salary" in title_lower: cat = "Salary"
                elif "gift" in title_lower: cat = "Shopping"
                
                days_ago = random.randint(0, 15)
                sim_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
                try:
                    new_tx = Transaction(title=row[0], amount=float(row[1]), type=row[2].lower().strip(), category=cat, date=sim_date)
                    db.session.add(new_tx)
                    count += 1
                except: continue
        db.session.commit()
        return jsonify({'message': f'Successfully imported {count} transactions'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)