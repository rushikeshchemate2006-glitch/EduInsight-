
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Feedback, Teacher, TeacherStats } from "../types";

// Helper to get AI instance
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// --- COMPREHENSIVE DATA (A to Z Programming Languages + School/Uni) ---
const FALLBACK_TEACHERS: Teacher[] = [
  // --- SCHOOL LEVEL ---
  { 
    id: "s1", name: "Mrs. Sunita Devi", subject: "Grade 1: Basics", category: "School",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sunita",
    syllabus: ["Unit A: Alphabets & Phonics", "Unit B: Numbers 1-100", "Unit C: Basic Math", "Unit D: Colors & Shapes", "Unit E: Good Habits", "Unit F: My Family", "Unit G: Community Helpers", "Unit H: Safety Rules"]
  },
  { 
    id: "s3", name: "Mrs. Geeta Verma", subject: "Grade 10: Maths", category: "School",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Geeta",
    syllabus: ["1. Real Numbers", "2. Polynomials", "3. Pair of Linear Eq.", "4. Quadratic Equations", "5. Arithmetic Progressions", "6. Triangles", "7. Coordinate Geometry", "8. Trigonometry Intro", "9. Applications of Trig", "10. Circles", "11. Areas related to Circles", "12. Surface Areas & Volumes", "13. Statistics", "14. Probability"]
  },
  { 
    id: "s4", name: "Mr. H.C. Verma Clone", subject: "Grade 12: Physics", category: "School",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=HCV",
    syllabus: ["1. Electric Charges & Fields", "2. Potential & Capacitance", "3. Current Electricity", "4. Moving Charges & Magnetism", "5. Magnetism & Matter", "6. Electromagnetic Induction", "7. Alternating Current", "8. Electromagnetic Waves", "9. Ray Optics", "10. Wave Optics", "11. Dual Nature of Matter", "12. Atoms", "13. Nuclei", "14. Semiconductors"]
  },

  // --- UNIVERSITY LEVEL ---
  { 
    id: "u1", name: "Prof. Feynman", subject: "B.Sc Physics", category: "University",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Feynman",
    syllabus: ["1. Mathematical Physics", "2. Classical Mechanics", "3. Special Relativity", "4. Quantum Mechanics I", "5. Thermodynamics", "6. Statistical Mechanics", "7. Electromagnetism", "8. Solid State Physics", "9. Nuclear Physics", "10. Particle Physics", "11. Electronics", "12. Advanced Quantum Mech"]
  },

  // --- PROFESSIONAL / ALL PROGRAMMING LANGUAGES (A to Z) ---
  { 
    id: "p_python", name: "Ms. Aditi Rao", subject: "Python Programming", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi",
    syllabus: [
      "1. Python Intro & Setup", "2. Variables & Data Types", "3. Operators & Expressions", 
      "4. Control Flow (If/Else)", "5. Loops (For/While)", "6. Functions & Lambdas", 
      "7. Lists & Tuples", "8. Sets & Dictionaries", "9. String Manipulation", 
      "10. File Handling", "11. Modules & Packages", "12. OOP: Classes & Objects", 
      "13. OOP: Inheritance", "14. Exception Handling", "15. Iterators & Generators", 
      "16. Decorators & Context Managers", "17. Regular Expressions", "18. Intro to NumPy/Pandas", 
      "19. Web Scraping Basics", "20. Final Project: Automation Bot"
    ]
  },
  { 
    id: "p_java", name: "Mr. James G.", subject: "Java Language", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Java",
    syllabus: [
      "1. Java Environment & JVM", "2. Variables & Data Types", "3. Operators & Control Flow", 
      "4. Loops & Arrays", "5. OOP: Classes & Objects", "6. OOP: Inheritance & Poly", 
      "7. OOP: Encapsulation & Abstraction", "8. Interfaces & Packages", "9. Exception Handling", 
      "10. Strings & StringBuilders", "11. Multithreading Basics", "12. Java I/O Streams", 
      "13. Collections Framework (List, Set, Map)", "14. Generics", "15. Lambda Expressions", 
      "16. Stream API", "17. JDBC Database Connectivity", "18. Final Project: Management System"
    ]
  },
  { 
    id: "p_js", name: "Mr. Tanay Gupta", subject: "JavaScript & Web", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tanay",
    syllabus: [
      "1. JS Intro & Engine", "2. Variables (let/const/var)", "3. Data Types & Operators", 
      "4. Control Flow & Loops", "5. Functions (Arrow/Declarations)", "6. Objects & Arrays", 
      "7. ES6+ Features (Destructuring, Spread)", "8. DOM Manipulation", "9. Events & Listeners", 
      "10. Async JS: Callbacks", "11. Promises & Async/Await", "12. Fetch API & JSON", 
      "13. LocalStorage & SessionStorage", "14. Modules (Import/Export)", "15. Error Handling", 
      "16. Closures & 'this' keyword", "17. Prototypes & Classes", "18. Final Project: Interactive App"
    ]
  },
  { 
    id: "p_cpp", name: "Mr. Bjarne S.", subject: "C++ Programming", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=CPP",
    syllabus: [
      "1. C++ Basics & Setup", "2. Input/Output (cin/cout)", "3. Variables & Data Types", 
      "4. Control Structures", "5. Functions & Recursion", "6. Arrays & Strings", 
      "7. Pointers & References", "8. Dynamic Memory (new/delete)", "9. OOP: Classes & Objects", 
      "10. OOP: Constructors/Destructors", "11. Operator Overloading", "12. OOP: Inheritance", 
      "13. OOP: Polymorphism & Virtual Functions", "14. Templates & Generics", "15. Exception Handling", 
      "16. STL: Vectors & Lists", "17. STL: Maps & Sets", "18. File Handling", 
      "19. Final Project: Banking System"
    ]
  },
  { 
    id: "p_csharp", name: "Ms. Anders H.", subject: "C# (.NET)", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=CSharp",
    syllabus: [
      "1. C# & .NET Architecture", "2. Syntax & Basic Types", "3. Control Flow & Loops", 
      "4. Methods & Parameters", "5. Arrays & Strings", "6. OOP: Classes & Structs", 
      "7. OOP: Inheritance & Polymorphism", "8. Interfaces & Abstract Classes", "9. Properties & Indexers", 
      "10. Delegates & Events", "11. Lambda Expressions", "12. LINQ (Language Integrated Query)", 
      "13. Exception Handling", "14. Collections & Generics", "15. Async/Await Programming", 
      "16. File I/O & Serialization", "17. Entity Framework Basics", "18. Final Project: Inventory App"
    ]
  },
  { 
    id: "p_c", name: "Mr. Dennis R.", subject: "C Language", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dennis",
    syllabus: [
      "1. C Intro & Compilation", "2. Variables, Constants, Keywords", "3. Operators & Expressions", 
      "4. Conditional Statements", "5. Loops (While, Do-While, For)", "6. Functions & Recursion", 
      "7. Arrays (1D & Multi-D)", "8. Strings & String Functions", "9. Pointers Intro", 
      "10. Pointer Arithmetic", "11. Pointers & Arrays/Functions", "12. Dynamic Memory (malloc/free)", 
      "13. Structures & Unions", "14. Typedef & Enumerations", "15. File Handling (FILE*)", 
      "16. Preprocessor Directives", "17. Command Line Arguments", "18. Final Project: Library System"
    ]
  },
  { 
    id: "p_go", name: "Mr. Gopher", subject: "Go (Golang)", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Go",
    syllabus: [
      "1. Go Intro & Workspace", "2. Variables & Constants", "3. Data Types & Zero Values", 
      "4. Control Structures (If/Switch)", "5. Loops (For is all you need)", "6. Functions & Multiple Returns", 
      "7. Arrays & Slices", "8. Maps (Hash Tables)", "9. Pointers in Go", 
      "10. Structs & Embedding", "11. Interfaces & Duck Typing", "12. Error Handling (Panic/Recover)", 
      "13. Goroutines (Concurrency)", "14. Channels & Buffered Channels", "15. Select Statement", 
      "16. Modules & Packages", "17. Testing in Go", "18. Final Project: Web Server"
    ]
  },
  { 
    id: "p_rust", name: "Mr. Ferris", subject: "Rust Systems", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rust",
    syllabus: [
      "1. Rust Intro & Cargo", "2. Variables & Mutability", "3. Data Types & Functions", 
      "4. Control Flow", "5. Ownership Concepts", "6. Borrowing & References", 
      "7. Slices", "8. Structs", "9. Enums & Pattern Matching", 
      "10. Modules & Crates", "11. Common Collections (Vectors, HashMaps)", "12. Error Handling (Result/Option)", 
      "13. Generics", "14. Traits (Interfaces)", "15. Lifetimes", 
      "16. Automated Tests", "17. Smart Pointers (Box/Rc)", "18. Final Project: CLI Tool"
    ]
  },
  { 
    id: "p_sql", name: "Mr. Sequel", subject: "SQL & Databases", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=SQL",
    syllabus: [
      "1. Database Concepts (RDBMS)", "2. SQL Syntax & Data Types", "3. CREATE & DROP Tables", 
      "4. INSERT, UPDATE, DELETE", "5. SELECT Fundamentals", "6. Filtering (WHERE, AND, OR)", 
      "7. Sorting & Limiting", "8. Aggregate Functions (COUNT, SUM)", "9. GROUP BY & HAVING", 
      "10. Joins: INNER JOIN", "11. Joins: LEFT/RIGHT/FULL", "12. Subqueries", 
      "13. Constraints (PK, FK, Unique)", "14. Indexes & Performance", "15. Views", 
      "16. Stored Procedures Intro", "17. Transactions (ACID)", "18. Final Project: E-commerce DB"
    ]
  },
  { 
    id: "p_php", name: "Mr. Rasmus", subject: "PHP Backend", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=PHP",
    syllabus: [
      "1. PHP Intro & Syntax", "2. Echo & Print", "3. Variables & Data Types", 
      "4. Strings & Numbers", "5. Constants & Operators", "6. If...Else & Switch", 
      "7. Loops (While/For/Foreach)", "8. Functions", "9. Arrays (Indexed/Assoc)", 
      "10. Superglobals ($_GET/$_POST)", "11. Form Handling", "12. Date & Time", 
      "13. File Handling (Read/Write)", "14. Cookies & Sessions", "15. PHP OOP Concepts", 
      "16. Database: MySQL Connect", "17. Database: Prepared Statements", "18. Final Project: CMS"
    ]
  },
  { 
    id: "p_swift", name: "Mr. Apple", subject: "Swift (iOS)", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Swift",
    syllabus: [
      "1. Swift Basics & Playgrounds", "2. Variables & Constants", "3. Basic Types & Tuples", 
      "4. Optionals & Unwrapping", "5. Operators & Control Flow", "6. Functions & Argument Labels", 
      "7. Closures", "8. Enumerations", "9. Structs vs Classes", 
      "10. Properties & Methods", "11. Subscripts & Inheritance", "12. Initialization", 
      "13. Protocols & Extensions", "14. Error Handling", "15. Generics", 
      "16. ARC (Memory Management)", "17. SwiftUI Basics", "18. Final Project: To-Do iOS App"
    ]
  },
  { 
    id: "p_kotlin", name: "Ms. JetBrains", subject: "Kotlin (Android)", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kotlin",
    syllabus: [
      "1. Kotlin Intro & JVM", "2. Variables (val/var)", "3. Basic Types & Strings", 
      "4. Control Flow (If/When)", "5. Loops & Ranges", "6. Functions", 
      "7. Null Safety (The Billion Dollar Fix)", "8. Classes & Objects", "9. Constructors & Inheritance", 
      "10. Interfaces", "11. Data Classes", "12. Sealed Classes & Enums", 
      "13. Lambdas & High Order Functions", "14. Collections & Sequences", "15. Extension Functions", 
      "16. Coroutines Basics", "17. Scope Functions (let/apply)", "18. Final Project: Weather App Logic"
    ]
  },
  { 
    id: "p_ruby", name: "Ms. Rails", subject: "Ruby Language", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby",
    syllabus: [
      "1. Ruby Intro & Interactive Ruby", "2. Variables & Data Types", "3. Strings & Interpolation", 
      "4. Symbols", "5. Numbers & Operators", "6. Control Structures", 
      "7. Loops & Iterators", "8. Methods", "9. Blocks, Procs, Lambdas", 
      "10. Arrays", "11. Hashes", "12. OOP: Classes & Objects", 
      "13. OOP: Attributes & Accessors", "14. OOP: Inheritance", "15. Modules & Mixins", 
      "16. File I/O", "17. Exceptions", "18. Final Project: CLI Game"
    ]
  },
  { 
    id: "p_ts", name: "Mr. Typer", subject: "TypeScript", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TS",
    syllabus: [
      "1. TS Intro & Configuration", "2. Basic Types (Number/String)", "3. Special Types (Any/Unknown/Never)", 
      "4. Arrays & Tuples", "5. Enums", "6. Functions & Type Annotations", 
      "7. Interfaces", "8. Type Aliases vs Interfaces", "9. Union & Intersection Types", 
      "10. Classes & Modifiers", "11. Generics Intro", "12. Generic Constraints", 
      "13. Utility Types (Partial/Pick)", "14. Type Guards & Narrowing", "15. Modules & Namespaces", 
      "16. Decorators", "17. TS with React Basics", "18. Final Project: Task Manager"
    ]
  },
  { 
    id: "p_r", name: "Dr. Statistica", subject: "R Programming", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=RLang",
    syllabus: [
      "1. R Intro & RStudio", "2. Variables & Data Types", "3. Vectors & Lists", 
      "4. Matrices & Arrays", "5. Factors", "6. Data Frames", 
      "7. Operators", "8. Conditional Statements", "9. Loops", 
      "10. Functions", "11. Strings", "12. Data Visualization (Base Graphics)", 
      "13. Intro to ggplot2", "14. Data Manipulation (dplyr)", "15. Statistics Basics (Mean/Median)", 
      "16. Probability Distributions", "17. Reading/Writing Data", "18. Final Project: Data Analysis Report"
    ]
  },
  { 
    id: "p_dart", name: "Mr. Flutter", subject: "Dart Language", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dart",
    syllabus: [
      "1. Dart Intro & Syntax", "2. Variables (var, final, const)", "3. Built-in Types", 
      "4. Functions", "5. Operators", "6. Control Flow Statements", 
      "7. Classes & Constructors", "8. Inheritance & Mixins", "9. Interfaces & Abstract Classes", 
      "10. Enums", "11. Extension Methods", "12. Collections (List, Set, Map)", 
      "13. Generics", "14. Libraries & Visibility", "15. Asynchrony (Future, Async, Await)", 
      "16. Streams", "17. Null Safety", "18. Final Project: Console App"
    ]
  },
  { 
    id: "p_scala", name: "Ms. Scalable", subject: "Scala Language", category: "Professional",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Scala",
    syllabus: [
      "1. Scala Intro & REPL", "2. Basics & Variables", "3. Control Structures", 
      "4. Functions", "5. Classes & Objects", "6. Traits", 
      "7. Collections (List, Set, Map)", "8. Tuples", "9. Functional Programming Concepts", 
      "10. Higher Order Functions", "11. Pattern Matching", "12. Case Classes", 
      "13. Option Type", "14. Exception Handling", "15. Implicits", 
      "16. Futures & Promises", "17. SBT Build Tool", "18. Final Project: Functional Calculator"
    ]
  }
];

const FALLBACK_FEEDBACK: Feedback[] = [
  { id: "f1", teacherId: "s1", numericRating: 10, comment: "My daughter loves the way she teaches counting!", sentimentScore: 0.9, topics: ["Engagement", "Care"], isFlagged: false, studentHash: "h1", timestamp: new Date().toISOString() },
  { id: "f2", teacherId: "p_python", numericRating: 9, comment: "Python concepts explained beautifully.", sentimentScore: 0.8, topics: ["Clarity", "Knowledge"], isFlagged: false, studentHash: "h2", timestamp: new Date().toISOString() },
  { id: "f3", teacherId: "p_js", numericRating: 5, comment: "React hooks are still confusing.", sentimentScore: -0.2, topics: ["Clarity"], isFlagged: false, studentHash: "h3", timestamp: new Date().toISOString() },
  { id: "f4", teacherId: "p_java", numericRating: 8, comment: "Java course is very comprehensive.", sentimentScore: 0.7, topics: ["Content"], isFlagged: false, studentHash: "h4", timestamp: new Date().toISOString() },
];

// 1. Synthetic Data Generation
export const generateMockDataset = async (): Promise<{ teachers: Teacher[]; feedback: Feedback[] }> => {
  const ai = getAI();
  const prompt = `
    Generate a JSON dataset for an Indian education platform 'EduInsight'.
    Create 4 teachers: 2 School Level and 2 University Level.
    Include syllabus and category.
    Return ONLY JSON.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      teachers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            subject: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["School", "University"] },
            syllabus: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "name", "subject", "category", "syllabus"],
        },
      },
      feedback: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            teacherId: { type: Type.STRING },
            numericRating: { type: Type.NUMBER },
            comment: { type: Type.STRING },
            sentimentScore: { type: Type.NUMBER },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
            isFlagged: { type: Type.BOOLEAN },
            timestamp: { type: Type.STRING },
          },
          required: ["teacherId", "numericRating", "comment", "sentimentScore", "topics", "isFlagged", "timestamp"],
        },
      },
    },
    required: ["teachers", "feedback"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    const data = JSON.parse(response.text || "{}");
    
    // Process generated teachers (School/University)
    const generatedTeachers = data.teachers.map((t: any) => ({ 
      ...t, 
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name.replace(/ /g, '')}` 
    }));
    
    // Process generated feedback
    const generatedFeedback = data.feedback.map((f: any) => ({ 
      ...f, 
      id: Math.random().toString(), 
      timestamp: new Date().toISOString() 
    }));

    // Merge with Comprehensive Professional Teachers
    const professionalTeachers = FALLBACK_TEACHERS.filter(t => t.category === "Professional");
    
    return { 
      teachers: [...generatedTeachers, ...professionalTeachers], 
      feedback: [...generatedFeedback, ...FALLBACK_FEEDBACK] 
    };

  } catch (error) {
    console.warn("Using Extended Fallback Data.");
    return { teachers: FALLBACK_TEACHERS, feedback: FALLBACK_FEEDBACK };
  }
};

// 2. ML Model (Feedback Analysis)
export const analyzeFeedback = async (comment: string, rating: number): Promise<{ sentimentScore: number; topics: string[]; isFlagged: boolean }> => {
  const ai = getAI();
  const prompt = `Analyze feedback. Rating: ${rating}/10. Comment: "${comment}". Return JSON: { sentimentScore, topics, isFlagged }`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      sentimentScore: { type: Type.NUMBER },
      topics: { type: Type.ARRAY, items: { type: Type.STRING } },
      isFlagged: { type: Type.BOOLEAN },
    },
    required: ["sentimentScore", "topics", "isFlagged"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    return JSON.parse(response.text || "{}");
  } catch {
    return { sentimentScore: rating > 5 ? 0.5 : -0.5, topics: ["General"], isFlagged: rating < 3 };
  }
};

// 3. Teacher Insight
export const generateTeacherInsight = async (teacher: Teacher, feedbackList: Feedback[]): Promise<string> => {
  const ai = getAI();
  const comments = feedbackList.slice(0, 10).map(f => f.comment).join(". ");
  const prompt = `Summarize teacher performance for ${teacher.name} based on: ${comments}. Max 2 sentences.`;
  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text || "Analysis pending.";
  } catch {
    return "Data processing for insights is currently delayed.";
  }
};

// 4. Tutor Session
export const createTutorSession = (context?: { name: string; subject: string; syllabus: string[]; category?: string }): Chat => {
  const ai = getAI();
  let systemInstruction = "You are a friendly, patient tutor. Explain things simply.";
  if (context) systemInstruction += ` You are ${context.name} teaching ${context.subject}. Stick to the syllabus: ${context.syllabus.join(", ")}.`;
  
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: { systemInstruction },
  });
};

// 5. Generate Lesson Content (Updated with Practice & Projects)
export const generateLessonContent = async (topic: string, subject: string, teacherName: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Act as a friendly tutor named ${teacherName}.
    Create "A to Z" study notes for the topic: "${topic}" in "${subject}".
    
    CRITICAL INSTRUCTION: 
    - Write for an "Average Student". Use VERY SIMPLE English.
    - Explain complex logic using Real-Life Analogies (Cooking, Traffic, Daily life).
    - Focus on "Understanding", "Memorization", and "Practice".

    Structure:
    # ${topic} - Easy Study Notes
    ## 💡 What is this? (Simple Definition)
    [Explain in 2 lines, like explaining to a friend.]
    
    ## 🧠 Memory Trick / Analogy
    [Give a fun, real-world analogy to remember this concept forever.]
    
    ## ⚡ Key Concepts & Syntax (A-Z)
    [Bulleted list. If coding, show code + explanation of each line.]
    
    ## 💻 Practice Question (Homework)
    [A simple problem for the student to solve on their own.]
    
    ## 🛠 Mini Project Idea
    [A small, fun project idea using this concept.]
    
    ## 🔥 Important Exam Question
    [1-2 questions that always come in exams.]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Content generation failed.";
  } catch (error) {
    return `
# ${topic} - Notes (Offline)
## 💡 What is this?
It is a key concept in ${subject}. (Offline mode active).
## 🧠 Memory Trick
Try to relate this to something you know well.
## 💻 Practice
Try writing a small program using this concept.
    `;
  }
};

// 6. Generate FULL COURSE MASTER NOTES (A to Z Comprehensive)
export const generateFullCourseNotes = async (subject: string, syllabus: string[], teacherName: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Act as Professor ${teacherName}.
    Create a comprehensive "A to Z Master Reference Guide" for the complete syllabus of: ${subject}.
    Target Audience: Students needing a complete, easy-to-understand revision of the entire subject.
    
    CRITICAL: You must cover ALL units in the syllabus: ${syllabus.join(", ")}.
    
    Structure:
    # 📘 ${subject} - A to Z Master Guide
    
    ## 🚀 Roadmap: Zero to Hero
    [Brief roadmap from beginner to advanced]

    ## 📚 Module-wise Notes (A-Z)
    [Iterate through EVERY unit in the syllabus. For EACH unit, use this format:
    
    ### 🔹 [Unit Name]
    **Concept:** [Simple, clear explanation]
    **Syntax / Formula:** [Key technical detail]
    **Real Life Analogy:** [Memorable comparison]
    **Pro Tip:** [Best practice or common mistake]
    ]
    
    ## 🔤 A-Z Glossary
    [List 5-10 strictly essential terms for this subject in alphabetical order with 1-line definitions. Format: **Term:** Definition]
    
    ## 💡 10 Golden Rules for Success
    [10 practical tips to master this subject]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Master guide generation failed.";
  } catch (error) {
    return `# 📘 ${subject} - Master Guide (Offline)\n\n## 🚀 Overview\nComplete study of ${subject}.\n\n*Connect to internet for full AI guide.*`;
  }
};

// 7. Generate Practice Problem (NEW)
export interface PracticeChallenge {
  title: string;
  description: string;
  testCase: string;
  hint: string;
  solution: string;
}

export const generatePracticeProblem = async (topic: string, subject: string): Promise<PracticeChallenge> => {
  const ai = getAI();
  const prompt = `
    Create a beginner-friendly coding/practice challenge for: "${topic}" in "${subject}".
    
    CRITICAL: Ensure the description is clear and the solution uses standard, clean code comments.
    
    Return JSON:
    {
      "title": "Creative Title related to the concept",
      "description": "A clear problem statement involving a real-world scenario (e.g., managing a store, calculating traffic)",
      "testCase": "Input: [Example Input] -> Output: [Expected Output]",
      "hint": "A subtle conceptual hint to guide the student without giving away the code",
      "solution": "The full, working code solution with comments"
    }
  `;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      testCase: { type: Type.STRING },
      hint: { type: Type.STRING },
      solution: { type: Type.STRING }
    },
    required: ["title", "description", "testCase", "hint", "solution"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      title: "Practice Problem",
      description: `Write a program to demonstrate ${topic}.`,
      testCase: "Input: A, Output: B",
      hint: "Review the syntax.",
      solution: "// Code here"
    };
  }
};

// 8. Generate Course Quiz
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const generateCourseQuiz = async (subject: string, syllabus: string[]): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const prompt = `Create 5 simple multiple choice questions for ${subject}. Return JSON: { quiz: [{ question, options, correctIndex }] }.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      quiz: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             question: { type: Type.STRING },
             options: { type: Type.ARRAY, items: { type: Type.STRING } },
             correctIndex: { type: Type.NUMBER }
          },
          required: ["question", "options", "correctIndex"]
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    const data = JSON.parse(response.text || "{}");
    return data.quiz.map((q: any, idx: number) => ({ ...q, id: `q-${idx}` }));
  } catch (e) {
    return [
      { id: "q1", question: "What is " + subject + "?", options: ["A Subject", "A Game", "A Food", "None"], correctIndex: 0 },
    ];
  }
};

// 9. Generate Notes from Video URL
export const generateVideoNotes = async (videoUrl: string): Promise<string> => {
  const ai = getAI();
  // Note: Gemini text-only models cannot watch external videos directly.
  // We use a prompt strategy to either infer known content (if popular) or provide a structured guide.
  const prompt = `
    I have a video link: ${videoUrl}.
    
    Task: Create comprehensive study notes for this video.
    
    If you can recognize this video (e.g. it is a famous tutorial, TED talk, or educational content from metadata in the URL), summarize it specifically.
    
    If you cannot access the specific video content directly:
    1. Infer the likely topic from the URL or assume it is a general educational video on the subject implied by the user's recent context or the URL text.
    2. Provide a "Universal Video Note-Taking Template" for this specific topic.
    
    Output Format:
    # 🎥 Video Study Notes
    ## 📌 Summary / Overview
    [Brief summary of what this video likely covers]
    
    ## 🔑 Key Takeaways (The "Golden Nuggets")
    - Point 1
    - Point 2
    - Point 3
    
    ## 📝 Detailed Concepts
    [Breakdown of concepts usually found in such videos]
    
    ## ❓ Self-Check Quiz
    [3 questions to ask yourself after watching]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Could not generate video notes.";
  } catch (error) {
    return "Error: Unable to process video URL. Please check your internet connection.";
  }
};

// 10. Generate Quick Cheat Sheet (NEW - "Jaldi" Notes)
export const generateCheatSheet = async (subject: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Create an "Ultra-Fast Cheat Sheet" for ${subject}.
    Target: Students/Developers needing quick syntax lookup and key facts.
    
    Format:
    # ⚡ ${subject} - Quick Cheat Sheet
    
    ## 🗝️ Core Syntax / Formulas
    | Concept | Syntax / Formula | Example |
    |---|---|---|
    [Fill with 5-10 rows of most important syntax/formulas]

    ## 🛠️ Common Patterns & Functions
    - **Concept 1:** Usage/Meaning
    - **Concept 2:** Usage/Meaning

    ## ⚠️ Gotchas / Common Mistakes
    - [Mistake 1]: How to fix
    - [Mistake 2]: How to fix
    
    Keep it extremely concise. No fluff. Just facts.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Cheat sheet generation failed.";
  } catch (error) {
    return `# ⚡ ${subject} Cheat Sheet (Offline)\n\n*Connect to internet for AI Cheat Sheet.*`;
  }
};
