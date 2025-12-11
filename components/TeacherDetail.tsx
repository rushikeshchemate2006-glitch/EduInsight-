
import React, { useState } from 'react';
import { Teacher, TeacherStats, Feedback } from '../types';
import { ArrowLeft, MessageSquare, Tag, BrainCircuit, AlertTriangle, Book, CheckCircle, Play, X, GraduationCap, Check, Clock, StickyNote, Flame, Bot, BookOpen, Code, Terminal, Eye, EyeOff, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { generateLessonContent, generateCourseQuiz, QuizQuestion, generateFullCourseNotes, generatePracticeProblem, PracticeChallenge, generateCheatSheet } from '../services/gemini';

interface TeacherDetailProps {
  teacher: Teacher;
  stats: TeacherStats;
  feedback: Feedback[];
  onBack: () => void;
  onAskTutor: () => void;
}

const TeacherDetail: React.FC<TeacherDetailProps> = ({ teacher, stats, feedback, onBack, onAskTutor }) => {
  // Notes State
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lectureContent, setLectureContent] = useState<string>("");
  const [loadingLecture, setLoadingLecture] = useState(false);
  
  // Full Course Guide State
  const [showMasterGuide, setShowMasterGuide] = useState(false);
  const [masterGuideContent, setMasterGuideContent] = useState<string>("");
  const [loadingMasterGuide, setLoadingMasterGuide] = useState(false);

  // Cheat Sheet State
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [cheatSheetContent, setCheatSheetContent] = useState<string>("");
  const [loadingCheatSheet, setLoadingCheatSheet] = useState(false);

  // Quiz State
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Practice Challenge State
  const [practiceTopic, setPracticeTopic] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<PracticeChallenge | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Prepare data for Radar Chart (Topic Performance)
  const radarData = stats.topTopics.map(t => ({
    subject: t.topic,
    A: Math.max(0, (t.sentiment + 1) * 50), // Map -1..1 to 0..100
    fullMark: 100,
  }));

  const handleOpenTopic = async (topic: string) => {
    setSelectedTopic(topic);
    setLoadingLecture(true);
    setLectureContent(""); // clear previous
    try {
      const content = await generateLessonContent(topic, teacher.subject, teacher.name);
      setLectureContent(content);
    } catch (e) {
      setLectureContent("Error loading lecture content.");
    } finally {
      setLoadingLecture(false);
    }
  };

  const handleOpenPractice = async (topic: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening notes
    setPracticeTopic(topic);
    setLoadingChallenge(true);
    setChallenge(null);
    setShowHint(false);
    setShowSolution(false);
    
    try {
      const prob = await generatePracticeProblem(topic, teacher.subject);
      setChallenge(prob);
    } catch (e) {
      alert("Could not generate practice problem.");
      setPracticeTopic(null);
    } finally {
      setLoadingChallenge(false);
    }
  };

  const handleOpenMasterGuide = async () => {
    setShowMasterGuide(true);
    // Only generate if not already generated to save API calls
    if (!masterGuideContent) {
      setLoadingMasterGuide(true);
      try {
        const content = await generateFullCourseNotes(teacher.subject, teacher.syllabus, teacher.name);
        setMasterGuideContent(content);
      } catch (e) {
        setMasterGuideContent("Error loading master guide.");
      } finally {
        setLoadingMasterGuide(false);
      }
    }
  };

  const handleOpenCheatSheet = async () => {
    setShowCheatSheet(true);
    if (!cheatSheetContent) {
      setLoadingCheatSheet(true);
      try {
        const content = await generateCheatSheet(teacher.subject);
        setCheatSheetContent(content);
      } catch (e) {
        setCheatSheetContent("Error loading cheat sheet.");
      } finally {
        setLoadingCheatSheet(false);
      }
    }
  };

  const handleStartQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const questions = await generateCourseQuiz(teacher.subject, teacher.syllabus);
      setQuizQuestions(questions);
      setQuizMode(true);
      setQuizSubmitted(false);
      setUserAnswers({});
    } catch (e) {
      alert("Could not start quiz. Please try again.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const calculateQuizScore = () => {
    let score = 0;
    quizQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) score++;
    });
    return score;
  };

  // Helper to render inline markdown (e.g. bolding)
  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img src={teacher.avatarUrl} alt={teacher.name} className="w-20 h-20 rounded-full border-4 border-white shadow-md" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{teacher.name}</h1>
            <p className="text-gray-500 text-lg">{teacher.subject}</p>
          </div>
        </div>
        <div className="flex gap-6">
            <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Quality Score</p>
                <p className={`text-4xl font-black ${stats.qualityScore > 7 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {stats.qualityScore.toFixed(1)}
                </p>
            </div>
             <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Avg Rating</p>
                <p className="text-4xl font-bold text-gray-700">
                    {stats.averageRating.toFixed(1)}
                </p>
            </div>
        </div>
      </div>

      {/* AI Insight Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
        <div className="flex items-start gap-4 relative z-10">
            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                <BrainCircuit size={24} />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-1">AI Performance Summary</h3>
                <p className="text-blue-800 leading-relaxed text-sm md:text-base">
                    {stats.aiSummary}
                </p>
            </div>
            <button 
              onClick={onAskTutor}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-bold shadow-sm hover:shadow-md hover:bg-blue-50 transition-all"
            >
              <Bot size={16} />
              Ask AI Tutor
            </button>
        </div>
        {/* Mobile button */}
        <button 
          onClick={onAskTutor}
          className="md:hidden mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
        >
          <Bot size={16} />
          Ask AI Tutor about {teacher.subject}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Syllabus Column */}
         <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[650px]">
            <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 pb-3">
              <Book size={20} className="text-purple-600" />
              <h3 className="text-lg font-bold text-gray-800">A to Z Syllabus</h3>
            </div>
            
            <div className="space-y-3 mb-4">
              <button 
                onClick={handleOpenMasterGuide}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <BookOpen size={18} />
                Access Full Master Guide
              </button>

              <button 
                onClick={handleOpenCheatSheet}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Get Quick Cheat Sheet
              </button>

              <button 
                onClick={handleStartQuiz}
                disabled={loadingQuiz}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loadingQuiz ? <Clock className="animate-spin" size={18} /> : <GraduationCap size={18} />}
                Start Final Course Exam
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Learn & Practice (Topic-wise)</p>
            
            <div className="space-y-3 overflow-y-auto pr-2 flex-1">
              {teacher.syllabus && teacher.syllabus.length > 0 ? (
                teacher.syllabus.map((topic, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleOpenTopic(topic)}
                    className="w-full text-left flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all group cursor-pointer relative"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center text-xs font-bold border border-purple-100 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-700 font-medium group-hover:text-purple-900 transition-colors">
                          {topic}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded">
                             <StickyNote size={10} /> Notes
                          </div>
                          <button 
                            onClick={(e) => handleOpenPractice(topic, e)}
                            className="flex items-center gap-1 text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded hover:bg-green-200 transition-colors z-10"
                          >
                             <Terminal size={10} /> Practice Problem
                          </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 italic">
                  No syllabus data available.
                </div>
              )}
            </div>
         </div>

         {/* Charts / Lecture / Quiz Column */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* SINGLE TOPIC NOTES MODAL (Overlay) */}
            {selectedTopic && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                       <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                          <StickyNote size={20} />
                       </div>
                       <div>
                         <h2 className="text-lg font-bold text-gray-900 line-clamp-1">Key Notes & IMP Questions</h2>
                         <p className="text-xs text-gray-500">A to Z Guide by Prof. {teacher.name} • {selectedTopic}</p>
                       </div>
                    </div>
                    <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto leading-relaxed text-gray-700 space-y-4">
                    {loadingLecture ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Extracting Important Questions & Notes...</p>
                      </div>
                    ) : (
                      <div className="prose prose-blue max-w-none">
                        {lectureContent.split('\n').map((line, i) => {
                          if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b">{line.replace('# ', '')}</h1>;
                          if (line.includes('IMP') || line.includes('Questions')) return <h2 key={i} className="text-xl font-bold text-red-600 mt-6 mb-3 flex items-center gap-2 bg-red-50 p-2 rounded"><Flame size={20}/> {line.replace('## ', '')}</h2>;
                          if (line.includes('Practice') || line.includes('Project')) return <h2 key={i} className="text-xl font-bold text-green-700 mt-6 mb-3 flex items-center gap-2 bg-green-50 p-2 rounded"><Code size={20}/> {line.replace('## ', '')}</h2>;
                          if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-800 mt-6 mb-3 flex items-center gap-2">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc marker:text-blue-500">{renderInlineMarkdown(line.replace('- ', ''))}</li>;
                          return <p key={i} className="mb-2">{renderInlineMarkdown(line)}</p>;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={() => setSelectedTopic(null)} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                      Close Notes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PRACTICE LAB MODAL (Overlay) */}
            {practiceTopic && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                   <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
                    <div className="flex items-center gap-3">
                       <div className="bg-green-500 p-2 rounded-lg">
                          <Terminal size={24} className="text-white" />
                       </div>
                       <div>
                         <h2 className="text-xl font-bold text-white">Coding Practice Lab</h2>
                         <p className="text-xs text-gray-300">Daily Challenge • {practiceTopic}</p>
                       </div>
                    </div>
                    <button onClick={() => setPracticeTopic(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                      <X size={20} className="text-white" />
                    </button>
                  </div>

                  <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
                     {loadingChallenge || !challenge ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                           <Code size={40} className="text-gray-300 animate-pulse"/>
                           <p className="text-gray-500">Generating unique challenge...</p>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.title}</h3>
                              <p className="text-gray-700 leading-relaxed">{challenge.description}</p>
                           </div>
                           
                           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-2">Test Case / Example</h4>
                              <code className="block bg-white p-3 rounded-lg border border-blue-100 text-blue-900 font-mono text-sm">
                                {challenge.testCase}
                              </code>
                           </div>

                           <div className="flex flex-col gap-3">
                              <button 
                                onClick={() => setShowHint(!showHint)}
                                className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 font-medium hover:bg-yellow-100 transition-colors"
                              >
                                 <div className="flex items-center gap-2"><BrainCircuit size={18}/> Need a Hint?</div>
                                 {showHint ? <EyeOff size={16}/> : <Eye size={16}/>}
                              </button>
                              {showHint && <p className="text-sm text-yellow-800 px-4 animate-fade-in">{challenge.hint}</p>}

                              <button 
                                onClick={() => setShowSolution(!showSolution)}
                                className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800 text-white font-medium hover:bg-gray-800 transition-colors"
                              >
                                 <div className="flex items-center gap-2"><Code size={18}/> View Solution Code</div>
                                 {showSolution ? <EyeOff size={16}/> : <Eye size={16}/>}
                              </button>
                              {showSolution && (
                                <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto animate-fade-in">
                                   <pre className="text-green-400 font-mono text-sm">{challenge.solution}</pre>
                                </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
                  
                  <div className="p-4 bg-white border-t border-gray-200 text-center">
                     <p className="text-xs text-gray-400">Try to solve it in your local IDE first!</p>
                  </div>
                </div>
              </div>
            )}

            {/* FULL MASTER GUIDE MODAL (Overlay) */}
            {showMasterGuide && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
                    <div className="flex items-center gap-3">
                       <div className="bg-white/20 p-2 rounded-lg">
                          <BookOpen size={24} className="text-white" />
                       </div>
                       <div>
                         <h2 className="text-xl font-bold text-white">Full Course Master Guide</h2>
                         <p className="text-xs text-gray-300">Total Subject Notes (All Units) • {teacher.subject}</p>
                       </div>
                    </div>
                    <button onClick={() => setShowMasterGuide(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                      <X size={20} className="text-white" />
                    </button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto leading-relaxed text-gray-700 space-y-4 bg-gray-50">
                    {loadingMasterGuide ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-6">
                         <BookOpen size={48} className="text-gray-300 animate-pulse" />
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                        <p className="text-gray-600 font-medium">Generating Total Course Guide... (This may take a moment)</p>
                      </div>
                    ) : (
                      <div className="prose prose-lg max-w-none">
                        {masterGuideContent.split('\n').map((line, i) => {
                          if (line.includes('MASTER GUIDE')) return <h1 key={i} className="text-3xl font-black text-gray-900 mb-6 pb-4 border-b-2 border-gray-200 text-center">{line.replace('# ', '')}</h1>;
                          if (line.includes('Golden Rules')) return <div key={i} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r"><h2 className="text-2xl font-bold text-yellow-800 m-0">{line.replace('## ', '')}</h2></div>;
                          if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-indigo-900 mt-8 mb-4 border-b border-indigo-100 pb-2">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-1 border-l-4 border-indigo-500 pl-2">{line.replace('### ', '')}</h3>;
                          if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc marker:text-indigo-500 mb-1">{renderInlineMarkdown(line.replace('- ', ''))}</li>;
                          return <p key={i} className="mb-2 text-gray-700">{renderInlineMarkdown(line)}</p>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

             {/* CHEAT SHEET MODAL (Overlay) */}
            {showCheatSheet && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    <div className="flex items-center gap-3">
                       <div className="bg-white/20 p-2 rounded-lg">
                          <Zap size={24} className="text-white" />
                       </div>
                       <div>
                         <h2 className="text-xl font-bold text-white">Ultra-Fast Cheat Sheet</h2>
                         <p className="text-xs text-yellow-100">Quick Syntax & Concepts • {teacher.subject}</p>
                       </div>
                    </div>
                    <button onClick={() => setShowCheatSheet(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                      <X size={20} className="text-white" />
                    </button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto leading-relaxed text-gray-700 space-y-4 bg-gray-50">
                    {loadingCheatSheet ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-6">
                         <Zap size={48} className="text-yellow-400 animate-pulse" />
                        <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
                        <p className="text-gray-600 font-medium">Compiling Quick Notes...</p>
                      </div>
                    ) : (
                      <div className="prose prose-lg max-w-none">
                         {/* Render cheat sheet content with markdown table support */}
                        {cheatSheetContent.split('\n').map((line, i) => {
                          if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">{line.replace('# ', '')}</h1>;
                          if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-orange-700 mt-8 mb-4 border-b border-orange-100 pb-2">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('|')) {
                             // Simple Table Rendering Logic
                             const cols = line.split('|').filter(c => c.trim() !== '');
                             if (line.includes('---')) return null; // Skip separator line for now, just render data
                             const isHeader = i > 0 && cheatSheetContent.split('\n')[i-1].includes('Syntax'); // Heuristic
                             return (
                                <div key={i} className="grid grid-cols-3 gap-2 border-b border-gray-200 py-2">
                                   {cols.map((col, idx) => (
                                      <div key={idx} className={`${isHeader ? 'font-bold bg-gray-100' : 'font-mono text-sm text-gray-800'}`}>{col}</div>
                                   ))}
                                </div>
                             )
                          }
                          if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc marker:text-orange-500 mb-1">{renderInlineMarkdown(line.replace('- ', ''))}</li>;
                          return <p key={i} className="mb-2 text-gray-700">{renderInlineMarkdown(line)}</p>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ MODAL (Overlay) */}
            {quizMode && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                       <GraduationCap size={24} />
                       <div>
                         <h2 className="text-xl font-bold">Final Course Exam</h2>
                         <p className="text-xs text-indigo-100">{teacher.subject} Assessment</p>
                       </div>
                    </div>
                    {!quizSubmitted && (
                       <button onClick={() => setQuizMode(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                       </button>
                    )}
                  </div>

                  <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                    {quizQuestions.map((q, idx) => {
                      const isCorrect = userAnswers[q.id] === q.correctIndex;
                      const userAnswer = userAnswers[q.id];
                      
                      return (
                        <div key={q.id} className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <p className="font-semibold text-gray-800 mb-4 flex gap-2">
                            <span className="text-indigo-600">{idx + 1}.</span> {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";
                              
                              if (quizSubmitted) {
                                if (optIdx === q.correctIndex) btnClass += "bg-green-100 border-green-500 text-green-800 font-bold ";
                                else if (optIdx === userAnswer && optIdx !== q.correctIndex) btnClass += "bg-red-100 border-red-500 text-red-800 ";
                                else btnClass += "bg-gray-50 border-gray-200 text-gray-400 ";
                              } else {
                                if (userAnswer === optIdx) btnClass += "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium ring-1 ring-indigo-500 ";
                                else btnClass += "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 ";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => !quizSubmitted && setUserAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                  disabled={quizSubmitted}
                                  className={btnClass}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{opt}</span>
                                    {quizSubmitted && optIdx === q.correctIndex && <CheckCircle size={16} className="text-green-600" />}
                                    {quizSubmitted && optIdx === userAnswer && optIdx !== q.correctIndex && <X size={16} className="text-red-500" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-5 border-t border-gray-200 bg-white flex justify-between items-center">
                    {quizSubmitted ? (
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Your Score</p>
                          <p className="text-2xl font-bold text-indigo-900">{calculateQuizScore()} / {quizQuestions.length}</p>
                        </div>
                        <button onClick={() => setQuizMode(false)} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                          Finish Review
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end w-full">
                        <button 
                          onClick={() => setQuizSubmitted(true)} 
                          disabled={Object.keys(userAnswers).length !== quizQuestions.length}
                          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Submit Exam
                        </button>
                      </div>
                    )}
                  </div>
                </div>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sentiment Trend */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Sentiment Trend</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.sentimentTrend}>
                              <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="date" hide />
                              <YAxis domain={[-1, 1]} hide />
                              <Tooltip />
                              <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Topic Radar */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Topic Competency</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{fontSize: 12}} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                              <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                              <Tooltip />
                          </RadarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
            </div>

            {/* Raw Feedback */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">Recent Student Feedback</h3>
              </div>
              <div className="divide-y divide-gray-100">
                  {feedback.map(f => (
                      <div key={f.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${f.numericRating >= 8 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                      {f.numericRating}/10
                                  </span>
                                  <span className="text-xs text-gray-400">{new Date(f.timestamp).toLocaleDateString()}</span>
                              </div>
                              <div className="flex gap-2">
                                  {f.isFlagged && (
                                      <span className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">
                                          <AlertTriangle size={12} className="mr-1" /> Flagged
                                      </span>
                                  )}
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${f.sentimentScore > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                      Sentiment: {f.sentimentScore > 0 ? 'Positive' : 'Negative'}
                                  </span>
                              </div>
                          </div>
                          <p className="text-gray-700 mb-3 text-sm leading-relaxed">{f.comment}</p>
                          <div className="flex gap-2 flex-wrap">
                              {f.topics.map(t => (
                                  <span key={t} className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                      <Tag size={10} className="mr-1" /> {t}
                                  </span>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TeacherDetail;
