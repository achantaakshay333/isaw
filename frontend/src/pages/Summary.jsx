import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DownloadCloud, FileText, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useDate } from '../context/DateContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const Summary = () => {
  const { selectedDate, isSelectedDate } = useDate();
  const [data, setData] = useState({ habits: [], tasks: [], learning: [], schedule: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [habitsRes, tasksRes, learningRes, scheduleRes] = await Promise.all([
        api.get('/habits/'),
        api.get('/tasks/'),
        api.get('/learning/'),
        api.get('/schedule/')
      ]);
      
      setData({
        habits: habitsRes.data,
        tasks: tasksRes.data,
        learning: learningRes.data,
        schedule: scheduleRes.data
      });
    } catch (err) {
      console.error("Error fetching summary data", err);
    }
    setLoading(false);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Habits Data
    const habitsSheet = XLSX.utils.json_to_sheet(data.habits.map(h => ({
      Title: h.title,
      Description: h.description || '',
      CurrentStreak: h.streak,
      CreatedOn: format(new Date(h.created_at), 'yyyy-MM-dd')
    })));
    XLSX.utils.book_append_sheet(wb, habitsSheet, "Habits");

    // 2. Tasks Data (Filtered by Selected Date)
    const filteredTasks = data.tasks.filter(t => isSelectedDate(t.created_at) || isSelectedDate(t.due_date));
    const tasksSheet = XLSX.utils.json_to_sheet(filteredTasks.map(t => ({
      Title: t.title,
      Status: t.is_completed ? 'Done' : 'Pending',
      Priority: t.priority,
      CreatedOn: format(new Date(t.created_at), 'yyyy-MM-dd')
    })));
    XLSX.utils.book_append_sheet(wb, tasksSheet, `Tasks_${format(selectedDate, 'MMM_dd')}`);

    // 3. Learning Logs (Filtered)
    const filteredLearning = data.learning.filter(l => isSelectedDate(l.created_at));
    const learningSheet = XLSX.utils.json_to_sheet(filteredLearning.map(l => ({
      Topic: l.topic,
      Category: l.category,
      DurationMins: l.duration,
      LoggedOn: format(new Date(l.created_at), 'yyyy-MM-dd')
    })));
    XLSX.utils.book_append_sheet(wb, learningSheet, `Learning_${format(selectedDate, 'MMM_dd')}`);

    // Generate Excel File
    XLSX.writeFile(wb, `Productivity_Report_${format(selectedDate, 'yyyy_MM_dd')}.xlsx`);
  };

  const filteredTasksCount = data.tasks.filter(t => isSelectedDate(t.created_at) || isSelectedDate(t.due_date)).length;
  const filteredLearningMins = data.learning.filter(l => isSelectedDate(l.created_at)).reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="space-y-8 p-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-500" />
            Summary Report
          </h1>
          <p className="text-slate-500 mt-1">Review your holistic progress for {format(selectedDate, 'MMMM do, yyyy')}</p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
        >
          <DownloadCloud className="w-5 h-5" />
          Export to Excel
        </button>
      </header>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl">Total Habits</h3>
          </div>
          <p className="text-4xl font-black text-slate-800">{data.habits.length}</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Active tracking streams</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl">Day's Learning</h3>
          </div>
          <p className="text-4xl font-black text-slate-800">{filteredLearningMins} <span className="text-xl text-slate-400">mins</span></p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Logged on selected date</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl">Day's Tasks</h3>
          </div>
          <p className="text-4xl font-black text-slate-800">{filteredTasksCount}</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Created or due on selected date</p>
        </div>
      </div>

      <div className="bg-slate-800 p-8 rounded-3xl text-white shadow-lg overflow-hidden relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500 rounded-full blur-3xl opacity-20"></div>
        <h2 className="text-2xl font-bold mb-4 relative z-10">Data Portability matters.</h2>
        <p className="text-slate-300 mb-6 relative z-10 max-w-2xl">
          Your productivity data is completely yours. By hitting the Export to Excel button, you generate a multi-sheet structured spreadsheet comprising all your historical habits, schedules, and the specific daily logs chosen via the universal calendar picker above.
        </p>
      </div>

    </div>
  );
};

export default Summary;
