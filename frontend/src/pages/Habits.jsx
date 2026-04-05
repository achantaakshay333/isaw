import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Check, Trash2, X, Circle } from 'lucide-react';
import { useDate } from '../context/DateContext';
import { format } from 'date-fns';

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const navigate = useNavigate();
  const { selectedDate, isSelectedDate } = useDate();

  useEffect(() => {
    fetchHabits();
  }, [selectedDate]);

  const fetchHabits = async () => {
    try {
      const res = await api.get('/habits/');
      setHabits(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleHabit = async (habit) => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const isDone = isHabitDoneOnSelectedDate(habit);
      const newStatus = isDone ? 'Not Completed' : 'Completed';

      await api.post('/tracking/', {
        item_type: 'Habit',
        item_id: habit.id,
        date: dateString,
        status: newStatus
      });
      fetchHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHabit = async (id) => {
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const isHabitDoneOnSelectedDate = (habit) => {
    return habit.logs && habit.logs.some(log => isSelectedDate(log.date) && log.status === 'Completed');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            Daily Habits
          </h1>
          <p className="text-slate-500 mt-1">Log your routines for {format(selectedDate, 'MMMM do, yyyy')}</p>
        </div>
        <button 
          onClick={() => navigate('/add-habit')}
          className="px-6 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-100 hover:text-amber-700 transition-colors border border-amber-200 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Habit
        </button>
      </header>

      <div className="grid gap-4">
        {habits.map((habit) => {
          const isDone = isHabitDoneOnSelectedDate(habit);
          return (
            <div key={habit.id} className={`p-6 rounded-3xl shadow-sm border flex items-center justify-between transition-all duration-300 ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => toggleHabit(habit)}
                  className={`p-3 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    isDone 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                      : 'bg-slate-50 text-slate-300 hover:bg-emerald-100 hover:text-emerald-500 border border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  {isDone ? <Check className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div>
                  <h3 className={`text-xl font-bold ${isDone ? 'text-emerald-900' : 'text-slate-800'}`}>{habit.title}</h3>
                  <div className={`flex items-center gap-2 mt-1 text-sm font-medium ${isDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                    <span>🔥 {habit.streak} day streak</span>
                    {habit.description && <span className="hidden sm:inline">| {habit.description}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => deleteHabit(habit.id)}
                  className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete habit permanently"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        
        {habits.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 text-slate-500 font-medium">
            No habits created yet. Click "New Habit" to start building your routine!
          </div>
        )}
      </div>
    </div>
  );
};

export default Habits;
