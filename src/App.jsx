import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Wallet, PieChart as PieIcon, Settings, Bell, Search, 
  TrendingUp, TrendingDown, Plus, Trash2, ArrowUpRight, ArrowDownRight, Menu, X, User, ChevronRight, Link as LinkIcon, Smartphone, CheckCircle, ShieldCheck, Activity, LogOut, Moon, Sun, Mail, Trash, Upload, XCircle
} from 'lucide-react';

const formatCurrency = (amount) => "₹" + amount.toLocaleString('en-IN');

// --- UTILS ---
const inferCategory = (title) => {
  const t = title.toLowerCase();
  if (t.includes('food') || t.includes('coffee') || t.includes('tea') || t.includes('restaurant') || t.includes('swiggy') || t.includes('zomato') || t.includes('burger') || t.includes('pizza')) return 'Food';
  if (t.includes('uber') || t.includes('ola') || t.includes('cab') || t.includes('metro') || t.includes('fuel') || t.includes('petrol') || t.includes('bus')) return 'Transport';
  if (t.includes('rent') || t.includes('electricity') || t.includes('water') || t.includes('wifi') || t.includes('broadband') || t.includes('bill') || t.includes('gas')) return 'Housing';
  if (t.includes('movie') || t.includes('netflix') || t.includes('prime') || t.includes('spotify') || t.includes('cinema') || t.includes('game')) return 'Entertainment';
  if (t.includes('shopping') || t.includes('amazon') || t.includes('flipkart') || t.includes('myntra') || t.includes('cloth') || t.includes('store')) return 'Shopping';
  if (t.includes('health') || t.includes('gym') || t.includes('doctor') || t.includes('med') || t.includes('pharmacy')) return 'Health';
  if (t.includes('salary') || t.includes('stipend') || t.includes('interest') || t.includes('cashback')) return 'Income';
  return 'Others';
};

// --- COMPONENTS ---
const SidebarItem = ({ icon: Icon, label, active, onClick, darkMode }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-medium ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : `${darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}`}>
    <Icon size={20} /><span>{label}</span>{active && <ChevronRight size={16} className="ml-auto opacity-50"/>}
  </button>
);

const StatCard = ({ label, value, trend, trendValue, icon: Icon, color, darkMode }) => (
  <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-6 rounded-2xl shadow-sm border flex flex-col justify-between h-full hover:shadow-md transition-all duration-300`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}><Icon size={24} className={`text-${color.split('-')[1]}-600`} /></div>
      {trend && (<div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{trend === 'up' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{trendValue}</div>)}
    </div>
    <div><h3 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>{value}</h3><p className={`text-sm font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p></div>
  </div>
);

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [health, setHealth] = useState(null);
  
  // FIX: Initialize budget from Local Storage
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('smartwealth_budget');
    return saved ? parseFloat(saved) : 25000;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [linkTab, setLinkTab] = useState('app'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [preferences, setPreferences] = useState({ darkMode: false, emailReports: true });
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense');
  
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'alert', title: 'Budget Alert', message: 'You have used 85% of your monthly budget.', time: '2 hours ago', icon: Bell, color: 'indigo' },
    { id: 2, type: 'success', title: 'Salary Received', message: 'Income of ₹50,000 was added automatically.', time: 'Yesterday', icon: CheckCircle, color: 'emerald' },
    { id: 3, type: 'info', title: 'Security Check', message: 'Your account was accessed from a new device.', time: '3 days ago', icon: ShieldCheck, color: 'blue' }
  ]);

  // FIX: Save budget whenever it changes
  useEffect(() => {
    localStorage.setItem('smartwealth_budget', budget);
  }, [budget]);

  const theme = {
    bg: preferences.darkMode ? 'bg-slate-950' : 'bg-[#F8FAFC]',
    text: preferences.darkMode ? 'text-slate-100' : 'text-slate-800',
    card: preferences.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100',
    cardText: preferences.darkMode ? 'text-white' : 'text-slate-800',
    subText: preferences.darkMode ? 'text-slate-400' : 'text-slate-500',
    input: preferences.darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-transparent border-none text-slate-700 placeholder:text-slate-400',
    sidebar: preferences.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100',
    hover: preferences.darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
    tableHeader: preferences.darkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50/50 text-slate-400',
    border: preferences.darkMode ? 'border-slate-800' : 'border-slate-100'
  };

  const fetchData = async () => {
    try {
      const [txRes, predRes, healthRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/predict'),
        axios.get('/api/health')
      ]);
      setTransactions(txRes.data);
      setPrediction(predRes.data);
      setHealth(healthRes.data);
    } catch (error) { console.error("Error", error); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- GLOBAL SEARCH HANDLER ---
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 0) {
      setActiveTab('Transactions'); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount) { alert("Please fill fields"); return; }
    const finalCategory = type === 'income' ? 'Salary' : category;
    const newTx = { title, amount: parseFloat(amount), category: finalCategory, type, date: new Date().toISOString().split('T')[0] };
    await axios.post('/api/transactions', newTx);
    setTitle(''); setAmount(''); setIsModalOpen(false); fetchData();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/transactions/${id}`);
    fetchData();
  };

  const handleSimulateSync = async () => {
    setSyncStatus('syncing');
    setTimeout(async () => {
      const dummyData = [
        { title: 'Zomato UPI', amount: 450, category: 'Food', type: 'expense' },
        { title: 'Uber Ride', amount: 320, category: 'Transport', type: 'expense' },
        { title: 'Jio Recharge', amount: 666, category: 'Others', type: 'expense' }
      ];
      for (const tx of dummyData) {
        const newTx = { ...tx, date: new Date().toISOString().split('T')[0] };
        await axios.post('/api/transactions', newTx);
      }
      setSyncStatus('success');
      fetchData();
      setTimeout(() => { setIsLinkModalOpen(false); setSyncStatus('idle'); }, 2000);
    }, 2500);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setSyncStatus('syncing');
      await axios.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSyncStatus('success');
      fetchData();
      setTimeout(() => { setIsLinkModalOpen(false); setSyncStatus('idle'); setFile(null); }, 2000);
    } catch (error) {
      alert("Error uploading file");
      setSyncStatus('idle');
    }
  };

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;
  const spendingPercentage = Math.min((expense / budget) * 100, 100);

  const categoryData = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      let cat = t.category;
      if (cat === 'Imported' || cat === 'Others') { cat = inferCategory(t.title); }
      if(!map[cat]) map[cat] = 0;
      map[cat] += t.amount;
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] }));
  }, [transactions]);

  const chartData = useMemo(() => {
    const grouped = {};
    transactions.forEach(t => {
      if (!grouped[t.date]) { grouped[t.date] = { date: t.date, income: 0, expense: 0 }; }
      if (t.type === 'income') grouped[t.date].income += t.amount;
      else grouped[t.date].expense += t.amount;
    });
    const sortedData = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    return sortedData.length > 0 ? sortedData : [{ date: 'No Data', income: 0, expense: 0 }];
  }, [transactions]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#06b6d4', '#84cc16'];

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h2 className={`text-2xl font-bold ${theme.cardText}`}>Dashboard</h2><p className={theme.subText}>Overview of your wallet status.</p></div>
        <button onClick={() => setIsLinkModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 ${theme.card} ${theme.cardText} rounded-xl font-medium ${theme.hover} shadow-sm transition-colors border`}><Smartphone size={18}/> Link / Import</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Balance" value={formatCurrency(balance)} trend="up" trendValue="+2.5%" icon={Wallet} color="bg-indigo-50" darkMode={preferences.darkMode} />
        <StatCard label="Total Income" value={formatCurrency(income)} trend="up" trendValue="+12%" icon={TrendingUp} color="bg-emerald-50" darkMode={preferences.darkMode} />
        <StatCard label="Total Expenses" value={formatCurrency(expense)} trend="down" trendValue="-5%" icon={TrendingDown} color="bg-rose-50" darkMode={preferences.darkMode} />
      </div>
      <div className={`${theme.card} rounded-2xl shadow-sm border overflow-hidden`}>
         <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}><h3 className={`font-bold ${theme.cardText}`}>Recent Transactions</h3><button onClick={() => setActiveTab('Transactions')} className="text-sm text-indigo-600 font-bold hover:underline">View All</button></div>
         <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className={`text-xs uppercase tracking-wider ${theme.tableHeader}`}><th className="p-4 font-semibold">Transaction</th><th className="p-4 font-semibold">Category</th><th className="p-4 font-semibold text-right">Amount</th></tr></thead><tbody className={`divide-y ${theme.border}`}>{transactions.slice(0, 5).map((t) => (<tr key={t.id} className={`${theme.hover} transition-colors`}><td className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{t.type === 'income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}</div><span className={`font-bold ${theme.cardText}`}>{t.title}</span></div></td><td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold border ${preferences.darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>{t.category}</span></td><td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : theme.cardText}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</td></tr>))}</tbody></table>{transactions.length === 0 && <div className={`p-8 text-center ${theme.subText}`}>No transactions found.</div>}</div>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    const score = health?.score || 0;
    const radius = 40; const circumference = 2 * Math.PI * radius; const strokeDashoffset = circumference - (score / 100) * circumference;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div><h2 className={`text-2xl font-bold ${theme.cardText}`}>Analytics & AI</h2><p className={theme.subText}>Deep dive into your spending habits.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
           <div className={`lg:col-span-2 ${theme.card} p-6 rounded-2xl shadow-sm border flex flex-col`}><h3 className={`font-bold mb-4 ${theme.cardText}`}>Daily Spending Trend</h3><div className="flex-1 w-full h-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient><linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={preferences.darkMode ? "#334155" : "#e2e8f0"}/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} tickFormatter={(str) => {const date = new Date(str); return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;}}/><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}}/><Tooltip contentStyle={{backgroundColor: preferences.darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', color: preferences.darkMode ? '#fff' : '#000', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value) => formatCurrency(value)}/><Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Income" /><Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Expense" /></AreaChart></ResponsiveContainer></div></div>
           <div className={`${theme.card} p-6 rounded-2xl shadow-sm border flex flex-col`}><h3 className={`font-bold mb-2 ${theme.cardText}`}>Category Breakdown</h3><div className="flex-1 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie>
                 <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{backgroundColor: preferences.darkMode ? '#1e293b' : '#fff', border: 'none', color: preferences.darkMode ? '#fff' : '#000'}}/>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Wallet className="text-indigo-500 mb-1" size={24}/>
                <span className={`text-xs font-bold ${theme.cardText} uppercase`}>SmartWealth</span>
             </div>
           </div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className={`${theme.card} p-6 rounded-2xl shadow-sm border`}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme.cardText}`}><ShieldCheck className="text-indigo-600"/> Financial Health Score</h3>
              <div className="flex items-center gap-6"><div className="relative w-24 h-24 flex items-center justify-center"><svg className="w-full h-full transform -rotate-90"><circle cx="48" cy="48" r={radius} fill="transparent" stroke={preferences.darkMode ? "#334155" : "#e2e8f0"} strokeWidth="8" /><circle cx="48" cy="48" r={radius} fill="transparent" stroke="#6366f1" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" /></svg><span className={`absolute text-2xl font-bold ${theme.cardText}`}>{score}</span></div><div><p className={`text-sm mb-2 ${theme.subText}`}>Your financial health is <strong>{score > 80 ? 'Excellent' : 'Average'}</strong>.</p><div className="flex gap-2 flex-wrap">{health && health.tips.slice(0,2).map((tip, i) => (<span key={i} className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-md border border-yellow-500/20">{tip}</span>))}</div></div></div>
           </div>
           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white"><h3 className="font-bold mb-1 flex items-center gap-2"><Activity/> AI Prediction</h3><p className="text-indigo-200 text-sm mb-6">Based on your spending patterns this month.</p><div className="flex justify-between items-end"><div><span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Forecasted Expense</span><h2 className="text-4xl font-bold">{formatCurrency(prediction?.predicted_total || 0)}</h2></div><div className="text-right"><p className="text-xs text-indigo-200">Days Remaining</p><p className="font-bold text-xl">{prediction ? prediction.days_in_month - prediction.current_day : 0}</p></div></div></div>
        </div>
      </div>
    );
  };

  const renderTransactions = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center"><h2 className={`text-2xl font-bold ${theme.cardText}`}>All Transactions</h2><div className="flex items-center gap-2"><span className={`text-sm ${theme.subText}`}>{transactions.length} entries found</span></div></div>
      <div className={`${theme.card} rounded-2xl shadow-sm border overflow-hidden`}><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className={`text-xs uppercase tracking-wider ${theme.tableHeader}`}><th className="p-4 font-semibold">Transaction</th><th className="p-4 font-semibold">Category</th><th className="p-4 font-semibold">Date</th><th className="p-4 font-semibold text-right">Amount</th><th className="p-4 font-semibold text-center">Action</th></tr></thead><tbody className={`divide-y ${theme.border}`}>{transactions.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (<tr key={t.id} className={`${theme.hover} transition-colors`}><td className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{t.type === 'income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}</div><span className={`font-bold ${theme.cardText}`}>{t.title}</span></div></td><td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold border ${preferences.darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>{t.category}</span></td><td className={`p-4 text-sm font-medium ${theme.subText}`}>{t.date}</td><td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : theme.cardText}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</td><td className="p-4 text-center"><button onClick={() => handleDelete(t.id)} className={`p-2 hover:text-rose-500 rounded-lg transition-all ${theme.subText}`}><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <h2 className={`text-2xl font-bold ${theme.cardText}`}>User Profile</h2>
       <div className={`${theme.card} p-8 rounded-2xl border shadow-sm flex flex-col items-center`}>
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 mb-4">U</div>
          <h3 className={`text-xl font-bold ${theme.cardText}`}>Final Year Student</h3>
          <p className={`${theme.subText} mb-6`}>Computer Engineering • Class of 2025</p>
          <div className="w-full space-y-4">
             <div className={`flex justify-between p-4 rounded-xl ${preferences.darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}><span className={`font-medium ${theme.subText}`}>Email</span><span className={`font-bold ${theme.cardText}`}>student@college.edu</span></div>
             <div className={`flex justify-between items-center p-4 rounded-xl ${preferences.darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}><span className={`font-medium ${theme.subText}`}>Monthly Budget</span><div className="flex items-center gap-1"><span className="text-slate-500 font-bold">₹</span><input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className={`bg-transparent font-bold text-right w-24 outline-none border-b border-transparent focus:border-indigo-500 transition-all ${theme.cardText}`}/></div></div>
             <p className="text-xs text-slate-400 text-center">💡 Tip: Edit the budget above to update your dashboard progress bar.</p>
             <button onClick={() => alert("Logged out successfully!")} className="w-full py-3 text-rose-500 font-bold hover:bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center gap-2"><LogOut size={18}/> Sign Out</button>
          </div>
       </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex justify-between items-center"><h2 className={`text-2xl font-bold ${theme.cardText}`}>Notifications</h2><button onClick={() => setNotifications([])} className="text-sm text-rose-500 font-bold hover:underline flex items-center gap-1"><Trash size={14}/> Clear All</button></div>
       <div className={`${theme.card} rounded-2xl border shadow-sm divide-y ${theme.border}`}>
          {notifications.length > 0 ? notifications.map(notif => (
             <div key={notif.id} className={`p-4 flex gap-4 ${theme.hover} transition-colors`}><div className={`p-2 bg-${notif.color}-100 text-${notif.color}-600 rounded-full h-fit`}><notif.icon size={20}/></div><div><h4 className={`font-bold ${theme.cardText}`}>{notif.title}</h4><p className={`text-sm ${theme.subText}`}>{notif.message}</p><p className="text-xs text-slate-400 mt-1">{notif.time}</p></div></div>
          )) : (<div className={`p-8 text-center ${theme.subText}`}><Bell size={48} className="mx-auto mb-4 opacity-20"/><p>No new notifications.</p></div>)}
       </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <h2 className={`text-2xl font-bold ${theme.cardText}`}>System Preferences</h2>
       <div className={`${theme.card} rounded-2xl border shadow-sm divide-y ${theme.border}`}>
          <div className="p-6 flex justify-between items-center cursor-pointer" onClick={() => setPreferences(p => ({...p, darkMode: !p.darkMode}))}><div className="flex gap-4 items-center"><div className={`p-2 rounded-lg ${preferences.darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}><Moon size={20}/></div><div><h4 className={`font-bold ${theme.cardText}`}>Dark Mode</h4><p className={`text-sm ${theme.subText}`}>Switch between light and dark themes.</p></div></div><div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${preferences.darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.darkMode ? 'left-7' : 'left-1'}`}></div></div></div>
          <div className="p-6 flex justify-between items-center cursor-pointer" onClick={() => setPreferences(p => ({...p, emailReports: !p.emailReports}))}><div className="flex gap-4 items-center"><div className={`p-2 rounded-lg ${preferences.darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}><Mail size={20} className={theme.subText}/></div><div><h4 className={`font-bold ${theme.cardText}`}>Email Reports</h4><p className={`text-sm ${theme.subText}`}>Receive weekly financial summaries.</p></div></div><div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${preferences.emailReports ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.emailReports ? 'left-7' : 'left-1'}`}></div></div></div>
       </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} flex font-sans ${theme.text} relative transition-colors duration-300`}>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 ${theme.sidebar} border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"><Wallet size={24} /></div><div><h1 className={`text-xl font-bold tracking-tight ${theme.cardText}`}>SmartWealth</h1><p className="text-xs text-slate-400 font-medium">PRO DASHBOARD</p></div></div>
          <nav className="space-y-2 flex-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => { setActiveTab('Dashboard'); setIsSidebarOpen(false); }} darkMode={preferences.darkMode} />
            <SidebarItem icon={Wallet} label="Transactions" active={activeTab === 'Transactions'} onClick={() => { setActiveTab('Transactions'); setIsSidebarOpen(false); }} darkMode={preferences.darkMode} />
            <SidebarItem icon={PieIcon} label="Analytics" active={activeTab === 'Analytics'} onClick={() => { setActiveTab('Analytics'); setIsSidebarOpen(false); }} darkMode={preferences.darkMode} />
            <div className="pt-6 pb-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Settings</p>
              <SidebarItem icon={Bell} label="Notifications" active={activeTab === 'Notifications'} onClick={() => setActiveTab('Notifications')} darkMode={preferences.darkMode} />
              <SidebarItem icon={User} label="User Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} darkMode={preferences.darkMode} />
              <SidebarItem icon={Settings} label="Preferences" active={activeTab === 'Preferences'} onClick={() => setActiveTab('Preferences')} darkMode={preferences.darkMode} />
            </div>
          </nav>
          <div className={`${preferences.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} p-4 rounded-xl border`}>
            <div className="flex justify-between mb-2"><p className="text-xs font-bold text-slate-500 uppercase">Budget Used</p><p className="text-xs font-bold text-indigo-500">{spendingPercentage.toFixed(0)}%</p></div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${spendingPercentage > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{width: `${spendingPercentage}%`}}></div></div>
            <p className="text-[10px] text-slate-400 mt-2">Target: {formatCurrency(budget)}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen flex flex-col">
        <header className={`${preferences.darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-md sticky top-0 z-30 border-b px-6 py-4 flex justify-between items-center shrink-0`}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`lg:hidden p-2 ${theme.subText} hover:bg-slate-100 rounded-lg`}><Menu size={24}/></button>
          <div className={`hidden md:flex items-center gap-4 ${preferences.darkMode ? 'bg-slate-800' : 'bg-slate-100'} px-4 py-2.5 rounded-xl w-96 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20`}><Search size={18} className="text-slate-400"/><input type="text" placeholder="Search transactions..." value={searchTerm} onChange={handleSearch} className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-inherit"/></div>
          <div className="flex items-center gap-4"><button onClick={() => setActiveTab('Notifications')} className="p-2 relative text-slate-400 hover:text-indigo-500 transition-colors"><Bell size={20}/><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span></button><button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95" onClick={() => setIsModalOpen(true)}>+ New Transaction</button></div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full pb-20">
           {activeTab === 'Dashboard' && renderDashboard()}
           {activeTab === 'Transactions' && renderTransactions()}
           {activeTab === 'Analytics' && renderAnalytics()}
           {activeTab === 'Notifications' && renderNotifications()}
           {activeTab === 'Profile' && renderProfile()}
           {activeTab === 'Preferences' && renderPreferences()}
        </div>
      </main>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className={`${theme.card} w-full max-w-md p-6 rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 border`}>
              <div className="flex justify-between items-center mb-6"><h3 className={`text-xl font-bold ${theme.cardText}`}>Add Transaction</h3><button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full ${theme.subText} hover:bg-slate-100 transition-colors`}><X size={20}/></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl ${preferences.darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}><button type="button" onClick={() => setType('expense')} className={`py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Expense</button><button type="button" onClick={() => setType('income')} className={`py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Income</button></div>
                 <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className={`w-full p-3 rounded-xl outline-none focus:border-indigo-500 border ${theme.input}`}/>
                 <div className="flex gap-4"><input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className={`w-1/2 p-3 rounded-xl outline-none focus:border-indigo-500 border ${theme.input}`}/>{type === 'expense' && (<select value={category} onChange={e => setCategory(e.target.value)} className={`w-1/2 p-3 rounded-xl outline-none focus:border-indigo-500 border cursor-pointer ${theme.input}`}>{['Food', 'Transport', 'Housing', 'Entertainment', 'Others'].map(c => <option key={c} value={c} className="text-slate-800">{c}</option>)}</select>)}</div>
                 <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 mt-4">Save</button>
              </form>
           </div>
        </div>
      )}

      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !syncStatus === 'syncing' && setIsLinkModalOpen(false)}></div>
           <div className={`${theme.card} w-full max-w-sm p-0 rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 overflow-hidden border`}>
              <div className={`p-4 border-b flex justify-between items-center ${theme.border} ${preferences.darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                 <h3 className={`text-sm font-bold ${theme.cardText}`}>Import Data</h3>
                 <button onClick={() => setIsLinkModalOpen(false)} className={`p-1 rounded-full ${theme.subText} hover:bg-slate-200/50`}><X size={18}/></button>
              </div>
              {syncStatus === 'idle' && (
                <>
                  <div className={`flex border-b ${theme.border}`}><button onClick={() => setLinkTab('app')} className={`flex-1 p-4 font-bold text-sm ${linkTab === 'app' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Connect App</button><button onClick={() => setLinkTab('file')} className={`flex-1 p-4 font-bold text-sm ${linkTab === 'file' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Import CSV</button></div>
                  {linkTab === 'app' ? (
                    <div className="p-6 space-y-3">
                      <p className={`text-xs text-center mb-4 ${theme.subText}`}>Simulate UPI connection for demo.</p>
                      <button onClick={handleSimulateSync} className={`w-full flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 transition-all group ${theme.border} ${theme.hover}`}><div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">G</div><div className="text-left"><p className={`font-bold text-sm ${theme.cardText}`}>Google Pay</p><p className="text-xs text-slate-400">Auto-fetch via UPI</p></div><ChevronRight size={16} className="ml-auto text-slate-400 group-hover:text-indigo-500"/></button>
                      <button onClick={handleSimulateSync} className={`w-full flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 transition-all group ${theme.border} ${theme.hover}`}><div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">Pe</div><div className="text-left"><p className={`font-bold text-sm ${theme.cardText}`}>PhonePe</p><p className="text-xs text-slate-400">Auto-fetch via UPI</p></div><ChevronRight size={16} className="ml-auto text-slate-400 group-hover:text-indigo-500"/></button>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4"><div className={`border-2 border-dashed ${theme.border} rounded-xl p-8 flex flex-col items-center justify-center text-center`}><Upload size={32} className="text-slate-400 mb-2"/><input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/></div><button onClick={handleFileUpload} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50" disabled={!file}>Upload Statement</button></div>
                  )}
                </>
              )}
              {syncStatus === 'syncing' && (<div className="p-12 text-center"><div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div><h3 className={`text-lg font-bold ${theme.cardText}`}>Processing...</h3></div>)}
              {syncStatus === 'success' && (<div className="p-12 text-center"><div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in"><CheckCircle size={32}/></div><h3 className={`text-lg font-bold ${theme.cardText}`}>Success!</h3></div>)}
           </div>
        </div>
      )}
    </div>
  );
}