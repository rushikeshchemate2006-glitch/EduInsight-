import React, { useState } from 'react';
import { Teacher } from '../types';
import { Send, Lock, Loader2 } from 'lucide-react';

interface FeedbackInputProps {
  teachers: Teacher[];
  onSubmit: (teacherId: string, rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
}

const FeedbackInput: React.FC<FeedbackInputProps> = ({ teachers, onSubmit, onCancel }) => {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !comment) return;
    
    setIsSubmitting(true);
    await onSubmit(selectedTeacher, rating, comment);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Student Feedback</h2>
              <p className="text-blue-100 text-sm mt-1 flex items-center">
                <Lock size={14} className="mr-1" /> 
                Anonymous & Encrypted Submission
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
            <select 
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">-- Choose a teacher --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-10)</label>
             <div className="flex items-center gap-4">
               <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={rating} 
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
               />
               <span className={`text-xl font-bold w-12 text-center ${rating >= 8 ? 'text-green-600' : rating <= 4 ? 'text-red-500' : 'text-yellow-600'}`}>
                 {rating}
               </span>
             </div>
             <div className="flex justify-between text-xs text-gray-400 mt-1">
               <span>Poor</span>
               <span>Excellent</span>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What worked well? What could be improved? Be constructive."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
              required
            />
             <p className="text-xs text-gray-500 mt-2">
                Your comments will be analyzed by AI for sentiment and topics. Please avoid personal attacks.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
             <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
             >
                Cancel
             </button>
             <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors flex justify-center items-center disabled:opacity-70"
             >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} className="mr-2" /> Submit Feedback</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackInput;
