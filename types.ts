
export interface Feedback {
  id: string;
  teacherId: string;
  studentHash: string; // Simulated anonymous hash
  timestamp: string;
  numericRating: number; // 1-10
  comment: string;
  // Derived ML Features
  sentimentScore: number; // -1.0 to 1.0
  topics: string[];
  isFlagged: boolean; // Needs intervention
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  category: 'School' | 'University' | 'Professional'; // New field for filtering
  avatarUrl: string;
  syllabus: string[]; // List of modules/topics (A to Z)
}

export interface TeacherStats {
  teacherId: string;
  averageRating: number; // Raw numeric avg
  qualityScore: number; // Composite score (Rating + Sentiment)
  totalReviews: number;
  sentimentTrend: { date: string; score: number }[];
  topTopics: { topic: string; count: number; sentiment: number }[];
  riskLevel: 'Low' | 'Medium' | 'High';
  aiSummary: string; // "Explainable" insight
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TEACHER_DETAIL = 'TEACHER_DETAIL',
  SUBMIT_FEEDBACK = 'SUBMIT_FEEDBACK',
  AI_TUTOR = 'AI_TUTOR',
}
