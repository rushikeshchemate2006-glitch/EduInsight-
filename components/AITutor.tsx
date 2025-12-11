
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, FileText, Youtube, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { ChatMessage, Teacher } from '../types';
import { createTutorSession, generateFullCourseNotes, generateVideoNotes } from '../services/gemini';
import { Chat } from "@google/genai";

interface AITutorProps {
  contextTeacher?: Teacher;
}

const AITutor: React.FC<AITutorProps> = ({ contextTeacher }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Video Notes State
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount or when context changes
    try {
        if (process.env.API_KEY) {
            chatSessionRef.current = createTutorSession(contextTeacher);
        }

        // Set initial welcome message based on context
        if (contextTeacher) {
          setMessages([{ 
            id: 'welcome', 
            role: 'model', 
            text: `Namaste! I am Prof. ${contextTeacher.name}. I am here to help you with ${contextTeacher.subject}. \n\nMy syllabus covers everything from ${contextTeacher.syllabus[0]} to ${contextTeacher.syllabus[Math.min(3, contextTeacher.syllabus.length - 1)]} and beyond. What shall we discuss?` 
          }]);
        } else {
          setMessages([{ 
            id: 'welcome', 
            role: 'model', 
            text: "Hello! I'm your AI Tutor. I can help you learn anything from basic concepts to advanced theories. What topic are you struggling with today?" 
          }]);
        }

    } catch (e) {
        console.error("Failed to init chat", e);
    }
  }, [contextTeacher]); // Re-run when contextTeacher changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerateFullNotes = async () => {
    if (!contextTeacher) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: "Please generate the A to Z Master Course Guide for this subject."
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Use the existing service to generate notes
      const notes = await generateFullCourseNotes(
        contextTeacher.subject, 
        contextTeacher.syllabus, 
        contextTeacher.name
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: notes
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Notes generation error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I couldn't generate the notes right now. Please try again later."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setShowVideoInput(false);
    
    // 1. Add User Message showing the link
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: `Generate notes for this video: ${videoUrl}`
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true); // Reuse main loading indicator for chat flow

    try {
      const notes = await generateVideoNotes(videoUrl);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: notes
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an issue processing that video link."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setVideoUrl(''); // Reset input
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      let promptToSend = userMsg.text;

      // Context Check: Does this question relate to the syllabus?
      if (contextTeacher && contextTeacher.syllabus) {
        const lowerInput = inputText.toLowerCase();
        
        // Identify relevant syllabus topics based on keyword matching (simple heuristic)
        // Check if any significant word in the syllabus topic is present in the input
        const relevantTopics = contextTeacher.syllabus.filter(topic => {
          const cleanTopic = topic.includes(':') ? topic.split(':')[1].trim() : topic;
          const keywords = cleanTopic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          return keywords.some(k => lowerInput.includes(k));
        });

        if (relevantTopics.length > 0) {
          // Prepend context instruction to the model (hidden from UI)
          // This ensures the model knows to prioritize syllabus content for this query
          promptToSend = `[System Context: The user is asking about topics found in your specific syllabus: "${relevantTopics.join(', ')}". Prioritize information strictly relevant to the course curriculum for these topics.]\n\n${userMsg.text}`;
        }
      }

      const response = await chatSessionRef.current.sendMessage({ message: promptToSend });
      const modelText = response.text || "I'm sorry, I couldn't process that request.";

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in relative">
      
      {/* Video URL Input Modal (Overlay) */}
      {showVideoInput && (
         <div className="absolute top-16 right-4 z-50 bg-white p-4 rounded-xl shadow-xl border border-gray-200 w-80 animate-scale-in">
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                 <Youtube size={16} className="text-red-600"/> Video Notes
               </h3>
               <button onClick={() => setShowVideoInput(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={16} />
               </button>
            </div>
            <form onSubmit={handleVideoNotesSubmit} className="space-y-3">
               <input 
                  type="url" 
                  placeholder="Paste YouTube or Video URL..." 
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  autoFocus
               />
               <button 
                 type="submit" 
                 className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
               >
                 Generate Notes
               </button>
            </form>
         </div>
      )}

      {/* Header */}
      <div className={`p-4 text-white flex items-center justify-between shadow-md z-10 ${contextTeacher ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}>
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <BookOpen size={24} className="text-white" />
            </div>
            <div>
                <h2 className="text-lg font-bold">{contextTeacher ? `Prof. ${contextTeacher.name}` : 'Personal AI Tutor'}</h2>
                <p className="text-white/90 text-xs">
                  {contextTeacher ? `Subject: ${contextTeacher.subject} (Syllabus Aware)` : 'Ask me anything - Basic to Advanced'}
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {/* New Video Notes Button */}
            <button 
               onClick={() => setShowVideoInput(!showVideoInput)}
               className={`p-2 rounded-full transition-colors ${showVideoInput ? 'bg-white text-red-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
               title="Make Notes from Video Link"
            >
               <LinkIcon size={20} />
            </button>

            {contextTeacher && (
                <button 
                    onClick={handleGenerateFullNotes}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10 shadow-sm"
                    title="Generate A to Z Course Notes"
                >
                    <FileText size={16} />
                    <span className="hidden md:inline">A-Z Notes</span>
                </button>
            )}
            <Sparkles size={20} className="text-yellow-300 animate-pulse" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : (contextTeacher ? 'bg-blue-100' : 'bg-purple-100')}`}>
              {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} className={contextTeacher ? "text-blue-600" : "text-purple-600"} />}
            </div>
            
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${contextTeacher ? 'bg-blue-100' : 'bg-purple-100'}`}>
               <Bot size={16} className={contextTeacher ? "text-blue-600" : "text-purple-600"} />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex gap-2 items-center">
              <span className={`w-2 h-2 rounded-full animate-bounce ${contextTeacher ? 'bg-blue-400' : 'bg-purple-400'}`}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce delay-100 ${contextTeacher ? 'bg-blue-400' : 'bg-purple-400'}`}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce delay-200 ${contextTeacher ? 'bg-blue-400' : 'bg-purple-400'}`}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={contextTeacher ? `Ask Prof. ${contextTeacher.name} about ${contextTeacher.subject}...` : "Ask about a concept, logic, or request an example..."}
            className={`w-full p-4 pr-14 bg-gray-100 border-0 rounded-xl focus:ring-2 text-gray-800 placeholder-gray-400 ${contextTeacher ? 'focus:ring-blue-500' : 'focus:ring-purple-500'}`}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isLoading}
            className={`absolute right-2 p-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${contextTeacher ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
