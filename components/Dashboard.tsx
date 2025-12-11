
import React, { useMemo, useState } from 'react';
import { Teacher, TeacherStats, Feedback } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, Users, ArrowRight, BookOpen, Code, GraduationCap, Backpack } from 'lucide-react';

interface DashboardProps {
  teachers: Teacher[];
  stats: TeacherStats[];
  onSelectTeacher: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ teachers, stats, onSelectTeacher }) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'School' | 'University' | 'Professional'>('All');
  
  const systemHealth = useMemo(() => {
    if (stats.length === 0) return { avg: 0, flagged: 0, total: 0 };
    const totalReviews = stats.reduce((acc, s) => acc + s.totalReviews, 0);
    const avgScore = stats.reduce((acc, s) => acc + s.qualityScore, 0) / stats.length;
    const flagged = stats.filter(s => s.riskLevel === 'High').length;
    return { avg: avgScore.toFixed(1), flagged, total: totalReviews };
  }, [stats]);

  const filteredStats = useMemo(() => {
    if (selectedCategory === 'All') return stats;
    return stats.filter(s => {
      const t = teachers.find(teach => teach.id === s.teacherId);
      return t?.category === selectedCategory;
    });
  }, [stats, teachers, selectedCategory]);

  const chartData = useMemo(() => {
    return filteredStats.map(s => {
      const t = teachers.find(teach => teach.id === s.teacherId);
      return {
        name: t?.name || 'Unknown',
        Score: parseFloat(s.qualityScore.toFixed(2)),
        Rating: parseFloat(s.averageRating.toFixed(2)),
      };
    }).sort((a, b) => b.Score - a.Score);
  }, [filteredStats, teachers]);

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'School': return <Backpack size={16} />;
          case 'University': return <GraduationCap size={16} />;
          case 'Professional': return <Code size={16} />;
          default: return <BookOpen size={16} />;
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <TrendingUp size={24} />
            <h3 className="font-semibold text-gray-700">System Quality</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{systemHealth.avg}</p>
          <p className="text-sm text-gray-500">Average weighted score</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 text-purple-600 mb-2">
            <Users size={24} />
            <h3 className="font-semibold text-gray-700">Total Feedback</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{systemHealth.total}</p>
          <p className="text-sm text-gray-500">Processed via NLP</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 text-red-500 mb-2">
            <AlertTriangle size={24} />
            <h3 className="font-semibold text-gray-700">Intervention Needed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{systemHealth.flagged}</p>
          <p className="text-sm text-gray-500">Teachers flagged high risk</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-start">
             <h3 className="text-gray-500 text-sm font-medium">Top Performer</h3>
             <p className="text-xl font-bold text-green-600 mt-1">
               {chartData[0]?.name || "N/A"}
             </p>
             <p className="text-xs text-gray-400">Based on AI Score</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Teacher Quality Leaderboard</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Legend />
              <Bar dataKey="Score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="AI Quality Score" />
              <Bar dataKey="Rating" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Raw Student Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Teacher List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800">Faculty Overview</h2>
          
          {/* Category Filter Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
             {(['All', 'School', 'University', 'Professional'] as const).map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {cat === 'Professional' ? 'Tech / Programming' : cat}
                </button>
             ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="p-4">Teacher</th>
                <th className="p-4">Subject</th>
                <th className="p-4 hidden md:table-cell">Category</th>
                <th className="p-4">Quality Score</th>
                <th className="p-4 hidden md:table-cell">Risk Level</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.length > 0 ? filteredStats.map((stat) => {
                const teacher = teachers.find(t => t.id === stat.teacherId);
                if (!teacher) return null;
                return (
                  <tr key={stat.teacherId} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <img src={teacher.avatarUrl} alt={teacher.name} className="w-8 h-8 rounded-full bg-gray-200" />
                      <span className="font-medium text-gray-900">{teacher.name}</span>
                    </td>
                    <td className="p-4">{teacher.subject}</td>
                    <td className="p-4 hidden md:table-cell">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600 w-fit">
                            {getCategoryIcon(teacher.category || '')} {teacher.category}
                        </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${stat.qualityScore > 7 ? 'text-green-600' : stat.qualityScore < 5 ? 'text-red-500' : 'text-yellow-600'}`}>
                          {stat.qualityScore.toFixed(1)}
                        </span>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${stat.qualityScore > 7 ? 'bg-green-500' : stat.qualityScore < 5 ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${(stat.qualityScore / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${stat.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 
                          stat.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}
                      `}>
                        {stat.riskLevel}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => onSelectTeacher(stat.teacherId)}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-xs"
                      >
                        View Insights <ArrowRight size={14} className="ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                 <tr>
                     <td colSpan={6} className="p-8 text-center text-gray-400">
                         No teachers found in this category.
                     </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
