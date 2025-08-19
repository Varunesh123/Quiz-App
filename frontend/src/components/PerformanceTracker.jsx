import { useState } from "react";
import { BookOpen, TrendingUp, Clock, Star } from 'lucide-react';

const PerformanceTracker = () => {
  const [timeFrame, setTimeFrame] = useState('week');
  const [performanceData, setPerformanceData] = useState({
    week: {
      quizzesCompleted: 5,
      averageScore: 78,
      timeSpent: 45,
      improvement: 12,
      strongSubjects: ['React', 'JavaScript'],
      weakSubjects: ['Node.js', 'MongoDB']
    },
    month: {
      quizzesCompleted: 18,
      averageScore: 75,
      timeSpent: 180,
      improvement: 8,
      strongSubjects: ['React', 'CSS'],
      weakSubjects: ['Algorithms', 'System Design']
    }
  });

  const data = performanceData[timeFrame];

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTimeFrame('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeFrame === 'week' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFrame('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeFrame === 'month' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="text-center">
          <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{data.quizzesCompleted}</h3>
          <p className="text-gray-600">Quizzes Completed</p>
        </div>
        
        <div className="text-center">
          <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{data.averageScore}%</h3>
          <p className="text-gray-600">Average Score</p>
        </div>
        
        <div className="text-center">
          <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{data.timeSpent}m</h3>
          <p className="text-gray-600">Time Spent</p>
        </div>
        
        <div className="text-center">
          <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Star className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">+{data.improvement}%</h3>
          <p className="text-gray-600">Improvement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Strong Subjects</h3>
          <div className="space-y-3">
            {data.strongSubjects.map((subject, index) => (
              <div key={subject} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">{subject}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-green-600 fill-current" />
                  <span className="text-sm text-green-600">{85 - index * 5}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
          <div className="space-y-3">
            {data.weakSubjects.map((subject, index) => (
              <div key={subject} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-red-800">{subject}</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{55 + index * 5}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Personalized Recommendation</h3>
        <p className="text-gray-700">
          Based on your performance, we recommend focusing on {data.weakSubjects[0]} topics. 
          Consider taking more practice quizzes in this area to improve your understanding.
        </p>
      </div>
    </div>
  );
};
export default PerformanceTracker;

// Demo Component to show all enhanced components
// export default function EnhancedQuizApp() {
//   const [currentView, setCurrentView] = useState('login');
//   const [user, setUser] = useState(null);

//   const handleLogin = (userData) => {
//     setUser(userData);
//     setCurrentView('dashboard');
//   };

//   const handleLogout = () => {
//     setUser(null);
//     setCurrentView('login');
//   };

//   const renderView = () => {
//     switch (currentView) {
//       case 'login':
//         return <Login onLogin={handleLogin} />;
//       case 'register':
//         return <Register onLogin={handleLogin} />;
//       case 'dashboard':
//         return (
//           <div>
//             <div className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
//               <div className="flex items-center gap-3">
//                 <BookOpen className="h-8 w-8 text-blue-600" />
//                 <span className="text-xl font-bold text-gray-900">QuizMaster</span>
//               </div>
//               <div className="flex items-center gap-4">
//                 <span className="text-gray-600">Welcome, {user?.name || 'User'}!</span>
//                 <button
//                   onClick={handleLogout}
//                   className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
//                 >
//                   Logout
//                 </button>
//               </div>
//             </div>
//             <Dashboard />
//           </div>
//         );
//       default:
//         return <Login onLogin={handleLogin} />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {currentView !== 'dashboard' && (
//         <div className="absolute top-4 right-4 z-10">
//           <div className="flex gap-2">
//             <button
//               onClick={() => setCurrentView('login')}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 currentView === 'login'
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-white text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               Login
//             </button>
//             <button
//               onClick={() => setCurrentView('register')}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 currentView === 'register'
//                   ? 'bg-green-600 text-white'
//                   : 'bg-white text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               Register
//             </button>
//           </div>
//         </div>
//       )}
//       {renderView()}
//     </div>
//   );
// }