import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Zap, Brain, Target, Flame, TrendingUp, ArrowRight, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useDate } from '../context/DateContext';

const Dashboard = () => {
  const { selectedDate, isSelectedDate } = useDate();
  const [stats, setStats] = useState({
    habitCompletion: 0,
    learningMinutes: 0,
    tasksCompleted: 0,
    streak: 0
  });
  const [insights, setInsights] = useState({ daily_suggestions: [], weekly_report: {} });
  const [loading, setLoading] = useState(true);

  // Example weekly chart data
  const chartData = [
    { name: 'Mon', value: 30 },
    { name: 'Tue', value: 45 },
    { name: 'Wed', value: 60 },
    { name: 'Thu', value: 40 },
    { name: 'Fri', value: 75 },
    { name: 'Sat', value: 90 },
    { name: 'Sun', value: 85 },
  ];

  const fetchDashboardData = async (date) => {
    setLoading(true);
    try {
      // For this MVP, we fetch everything and filter by date locally
      // A production app would pass ?date=YYYY-MM-DD to specialized backend endpoints
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const [insightsRes, habitsRes, tasksRes, learningRes] = await Promise.all([
        api.get('/insights/'),
        api.get('/habits/'),
        api.get('/tasks/'),
        api.get('/learning/')
      ]);

      setInsights(insightsRes.data);

      // Filter tasks due or created on selected date
      const daysTasks = tasksRes.data.filter(t => isSelectedDate(t.due_date) || isSelectedDate(t.created_at));
      const completedTasks = daysTasks.filter(t => t.is_completed).length;

      // Filter learning logs for selected date
      const daysLogs = learningRes.data.filter(l => isSelectedDate(l.created_at));
      const totalMins = daysLogs.reduce((acc, curr) => acc + curr.duration, 0);

      // Compute exact Habit completion for the selected date
      const daysHabits = habitsRes.data;
      const completedHabitsCount = daysHabits.filter(h => h.logs && h.logs.some(log => isSelectedDate(log.completed_at))).length;
      const avgHabit = daysHabits.length > 0 ? Math.round((completedHabitsCount / daysHabits.length) * 100) : 0;

      const currentStreak = insightsRes.data.weekly_report.habit_summaries?.reduce((acc, h) => Math.max(acc, h.streak), 0) || 0;

      setStats({
        habitCompletion: avgHabit,
        learningMinutes: totalMins,
        tasksCompleted: completedTasks,
        streak: currentStreak
      });

    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const kpis = [
    { label: "Habits Avg", value: `${stats.habitCompletion}%`, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Learning", value: `${stats.learningMinutes}m`, icon: Brain, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Tasks Done", value: `${stats.tasksCompleted}`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Top Streak", value: `${stats.streak}d`, icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up p-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Your Overview</h1>
        <p className="text-slate-500 mt-1">Data for {format(selectedDate, 'MMMM do, yyyy')}</p>
      </header>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-default">
            <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform duration-300`}>
              <kpi.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Routing Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link to="/habits" className="flex items-center gap-3 px-6 py-4 bg-amber-50 rounded-2xl font-bold text-amber-700 hover:bg-amber-100 transition-all shadow-sm flex-1 md:flex-none justify-center">
          <Zap className="w-5 h-5" /> Manage Habits
        </Link>
        <Link to="/tasks" className="flex items-center gap-3 px-6 py-4 bg-emerald-50 rounded-2xl font-bold text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm flex-1 md:flex-none justify-center">
          <Target className="w-5 h-5" /> Pending Tasks
        </Link>
        <Link to="/learning" className="flex items-center gap-3 px-6 py-4 bg-blue-50 rounded-2xl font-bold text-blue-700 hover:bg-blue-100 transition-all shadow-sm flex-1 md:flex-none justify-center">
          <Brain className="w-5 h-5" /> Log Learning
        </Link>
        <Link to="/schedule" className="flex items-center gap-3 px-6 py-4 bg-purple-50 rounded-2xl font-bold text-purple-700 hover:bg-purple-100 transition-all shadow-sm md:ml-auto w-full md:w-auto justify-center">
          View Full Schedule <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Weekly Progress</h2>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              +12% Consistency
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-8 rounded-3xl shadow-xl shadow-primary-200 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <Lightbulb className="w-8 h-8 text-amber-300 drop-shadow-md" />
            <h2 className="text-2xl font-black">AI Insights</h2>
          </div>
          <div className="space-y-4 relative z-10">
            {insights.daily_suggestions.length > 0 ? (
              insights.daily_suggestions.map((s, i) => (
                <div key={i} className="bg-black/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-black/20 transition-colors">
                  <p className="text-sm font-medium leading-relaxed">{s}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-200 text-sm font-medium">Add more activities to generate personalized insights!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
