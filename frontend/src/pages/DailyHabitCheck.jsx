import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';
import api from '../services/api';
import { format } from 'date-fns';
import { Check, X, Target } from 'lucide-react';

const DailyHabitCheck = () => {
  const { selectedDate } = useDate();
  const [habits, setHabits] = useState([]);
  const [trackingLogs, setTrackingLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const [habitsRes, trackingRes] = await Promise.all([
        api.get('/habits/'),
        api.get(`/tracking/?target_date=${dateString}&item_type=Habit`)
      ]);
      setHabits(habitsRes.data);
      setTrackingLogs(trackingRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateStatus = async (habitId, status) => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      // Optimistic update
      const existing = trackingLogs.find(log => log.item_id === habitId);
      if (existing) {
        setTrackingLogs(trackingLogs.map(log => log.item_id === habitId ? { ...log, status } : log));
      } else {
        setTrackingLogs([...trackingLogs, { item_id: habitId, status }]);
      }

      await api.post('/tracking/', {
        item_type: 'Habit',
        item_id: habitId,
        date: dateString,
        status: status
      });
    } catch (err) {
      console.error(err);
      fetchData(); // Rollback on error
    }
  };

  const completedCount = trackingLogs.filter(log => log.status === 'Completed').length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) return <div className="p-8 font-bold text-slate-400">Loading tracking data...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8 animate-fade-in-up">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-2">
          <Target className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Daily Habit Check</h1>
        <p className="text-slate-500 font-medium text-lg">Did you execute your routines on {format(selectedDate, 'MMMM do, yyyy')}?</p>
      </header>

      {totalCount > 0 ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Today's Progress</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{completedCount} of {totalCount} Completed</h2>
            </div>
            <span className="text-2xl font-black text-indigo-600">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 text-slate-500">
          No habits exist yet! Go to the Habit Manager to create some.
        </div>
      )}

      <div className="space-y-4">
        {habits.map(habit => {
          const log = trackingLogs.find(l => l.item_id === habit.id);
          const status = log ? log.status : 'Pending';

          return (
            <div key={habit.id} className={`p-6 bg-white rounded-3xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ${status === 'Completed' ? 'border-emerald-200 bg-emerald-50/30' : status === 'Not Completed' ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-indigo-100'}`}>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{habit.title}</h3>
                {habit.description && <p className="text-slate-500 text-sm mt-1">{habit.description}</p>}
                
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
                  <span>Current Status:</span>
                  <span className={status === 'Completed' ? 'text-emerald-600' : status === 'Not Completed' ? 'text-red-500' : 'text-slate-400'}>
                    {status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                <p className="text-sm font-bold text-slate-700">Did you complete this today?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateStatus(habit.id, 'Completed')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${status === 'Completed' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 border border-slate-200'}`}
                  >
                    <Check className="w-5 h-5" /> Yes
                  </button>
                  <button 
                    onClick={() => updateStatus(habit.id, 'Not Completed')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${status === 'Not Completed' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200'}`}
                  >
                    <X className="w-5 h-5" /> No
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyHabitCheck;
