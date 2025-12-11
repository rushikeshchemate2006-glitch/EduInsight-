
import React, { useState, useEffect, useCallback } from 'react';
import { Teacher, Feedback, TeacherStats, AppView } from './types';
import Dashboard from './components/Dashboard';
import TeacherDetail from './components/TeacherDetail';
import FeedbackInput from './components/FeedbackInput';
import AITutor from './components/AITutor';
import { generateMockDataset, analyzeFeedback, generateTeacherInsight } from './services/gemini';
import { Loader2, GraduationCap, LayoutDashboard, PlusCircle, Settings, Key, BookOpen } from 'lucide-react';

// --- Helper for Teacher Scoring Logic (The "Model") ---
const calculateTeacherStats = (teacherId: string, allFeedback: Feedback[], existingSummary?: string): TeacherStats => {
  const teacherFeedback = allFeedback.filter(f => f.teacherId === teacherId);
  
  if (teacherFeedback.length === 0) {
    return {
      teacherId,
      averageRating: 0,
      qualityScore: 0,
      totalReviews: 0,
      sentimentTrend: [],
      topTopics: [],
      riskLevel: 'Low',
      aiSummary: "Insufficient data for analysis.",
    };
  }

  const avgRating = teacherFeedback.reduce((sum, f) => sum + f.numericRating, 0) / teacherFeedback.length;
  const avgSentiment = teacherFeedback.reduce((sum, f) => sum + f.sentimentScore, 0) / teacherFeedback.length;
  
  // Composite Score Algorithm: 70% Rating, 30% Sentiment (normalized 0-10)
  const normalizedSentiment = (avgSentiment + 1) * 5; // -1..1 -> 0..10
  const qualityScore = (avgRating * 0.7) + (normalizedSentiment * 0.3);

  // Risk Logic
  const flaggedCount = teacherFeedback.filter(f => f.isFlagged).length;
  const riskRatio = flaggedCount / teacherFeedback.length;
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (riskRatio > 0.3 || qualityScore < 4) riskLevel = 'High';
  else if (riskRatio > 0.1 || qualityScore < 6) riskLevel = 'Medium';

  // Topic Extraction
  const topicMap: Record<string, {count: number, sentimentSum: number}> = {};
  teacherFeedback.forEach(f => {
    f.topics.forEach(t => {
      if (!topicMap[t]) topicMap[t] = { count: 0, sentimentSum: 0 };
      topicMap[t].count++;
      topicMap[t].sentimentSum += f.sentimentScore;
    });
  });

  const topTopics = Object.entries(topicMap)
    .map(([topic, data]) => ({ topic, count: data.count, sentiment: data.sentimentSum / data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend Data (Mock timeline based on sorting)
  const sentimentTrend = teacherFeedback
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(f => ({ date: f.timestamp, score: f.sentimentScore }));

  return {
    teacherId,
    averageRating: avgRating,
    qualityScore,
    totalReviews: teacherFeedback.length,
    sentimentTrend,
    topTopics,
    riskLevel,
    aiSummary: existingSummary || "Pending AI Analysis...",
  };
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<TeacherStats[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Initializing AI System...");
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      if (!process.env.API_KEY) {
        setApiKeyMissing(true);
        setLoading(false);
        return;
      }

      setLoadingMessage("Fetching comprehensive dataset...");
      try {
        // Now returns fully analyzed data (or fallback data if API limit hit)
        const { teachers: genTeachers, feedback: genFeedback } = await generateMockDataset();
        
        setTeachers(genTeachers);
        setFeedback(genFeedback);

        // Calculate initial stats immediately with the data we have
        const initialStats = genTeachers.map(t => calculateTeacherStats(t.id, genFeedback));
        setStats(initialStats);
        
        // Optimistically update insights in background
        // If this hits rate limits, the fallback inside generateTeacherInsight will handle it
        setLoadingMessage("Finalizing AI Insights...");
        
        // We do this concurrently but independently so UI can load
        Promise.all(genTeachers.map(async (teacher) => {
           const summary = await generateTeacherInsight(teacher, genFeedback.filter(f => f.teacherId === teacher.id));
           setStats(prev => prev.map(s => s.teacherId === teacher.id ? { ...s, aiSummary: summary } : s));
        }));

      } catch (e) {
        console.error("Initialization error", e);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTeacherSelect = (id: string) => {
    setSelectedTeacherId(id);
    setView(AppView.TEACHER_DETAIL);
  };

  const handleFeedbackSubmit = async (teacherId: string, rating: number, comment: string) => {
    // 1. Analyze new feedback (handles 429 internally)
    const mlResult = await analyzeFeedback(comment, rating);
    
    const newEntry: Feedback = {
      id: Math.random().toString(36).substr(2, 9),
      teacherId,
      studentHash: "anon_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      numericRating: rating,
      comment,
      ...mlResult
    };

    // 2. Update State
    const updatedFeedback = [...feedback, newEntry];
    setFeedback(updatedFeedback);
    
    // 3. Re-calculate stats for that teacher
    const teacher = teachers.find(t => t.id === teacherId)!;
    // Don't block UI on this summary update
    const updatedStat = calculateTeacherStats(teacherId, updatedFeedback, stats.find(s => s.teacherId === teacherId)?.aiSummary);
    setStats(prev => prev.map(s => s.teacherId === teacherId ? updatedStat : s));
    
    // Try to update AI summary in background
    generateTeacherInsight(teacher, updatedFeedback.filter(f => f.teacherId === teacherId)).then(summary => {
       setStats(prev => prev.map(s => s.teacherId === teacherId ? { ...s, aiSummary: summary } : s));
    });

    setView(AppView.DASHBOARD);
  };

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
           <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
             <Key size={32} />
           </div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">API Key Missing</h1>
           <p className="text-gray-500 mb-6">
             The application requires a Gemini API Key to function. 
             Please restart the environment with the <code>API_KEY</code> environment variable set.
           </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">{loadingMessage}</h2>
        <p className="text-gray-400 mt-2 text-sm">Powered by Gemini 2.5 Flash</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                 <GraduationCap className="text-white h-6 w-6" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-gray-900">EduInsight</span>
                <span className="text-blue-600 font-bold text-xl">AI</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button 
                onClick={() => setView(AppView.DASHBOARD)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === AppView.DASHBOARD ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutDashboard size={18} className="mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </button>
              
              <button 
                onClick={() => setView(AppView.AI_TUTOR)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === AppView.AI_TUTOR ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <BookOpen size={18} className="mr-2" />
                <span className="hidden md:inline">AI Tutor</span>
              </button>

              <button 
                onClick={() => setView(AppView.SUBMIT_FEEDBACK)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === AppView.SUBMIT_FEEDBACK ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <PlusCircle size={18} className="mr-2" />
                <span className="hidden md:inline">Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === AppView.DASHBOARD && (
          <Dashboard teachers={teachers} stats={stats} onSelectTeacher={handleTeacherSelect} />
        )}

        {view === AppView.TEACHER_DETAIL && selectedTeacherId && (
          <TeacherDetail 
            teacher={teachers.find(t => t.id === selectedTeacherId)!}
            stats={stats.find(s => s.teacherId === selectedTeacherId)!}
            feedback={feedback.filter(f => f.teacherId === selectedTeacherId)}
            onBack={() => setView(AppView.DASHBOARD)}
            onAskTutor={() => setView(AppView.AI_TUTOR)}
          />
        )}

        {view === AppView.SUBMIT_FEEDBACK && (
          <FeedbackInput 
            teachers={teachers} 
            onSubmit={handleFeedbackSubmit}
            onCancel={() => setView(AppView.DASHBOARD)}
          />
        )}

        {view === AppView.AI_TUTOR && (
          <AITutor contextTeacher={teachers.find(t => t.id === selectedTeacherId)} />
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© 2024 EduInsight AI. AI-Driven Educational Analytics & Tutoring.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
