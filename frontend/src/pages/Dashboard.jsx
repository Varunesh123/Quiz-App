import React, { useState, useEffect } from 'react';
import { Search, Plus, Play, Trophy, BookOpen, Clock, Users, TrendingUp, Star, Filter } from 'lucide-react';
import QuizTaker from '../components/QuizTaker';
import QuizGenerator from '../components/QuizGenerator';
import PerformanceTracker from '../components/PerformanceTracker';

// Enhanced Dashboard Component
const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    completedQuizzes: 0,
    streak: 0
  });

  useEffect(() => {
    fetchQuizzes();
    fetchStats();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Simulated API call - replace with actual getQuizzes() call
      const mockQuizzes = [
        { _id: '1', topic: 'React Fundamentals', difficulty: 'easy', questions: 10, averageScore: 85, timeLimit: 15, createdAt: '2024-01-15' },
        { _id: '2', topic: 'JavaScript ES6+', difficulty: 'medium', questions: 15, averageScore: 72, timeLimit: 20, createdAt: '2024-01-20' },
        { _id: '3', topic: 'Node.js Advanced', difficulty: 'hard', questions: 12, averageScore: 65, timeLimit: 25, createdAt: '2024-01-25' }
      ];
      setQuizzes(mockQuizzes);
      setStats(prev => ({ ...prev, totalQuizzes: mockQuizzes.length }));
    } catch (err) {
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Simulated stats fetch
    setStats({
      totalQuizzes: 15,
      averageScore: 78,
      completedQuizzes: 12,
      streak: 5
    });
  };

  const handleGenerated = (newQuiz) => {
    setQuizzes([...quizzes, newQuiz]);
    setShowGenerator(false);
    setStats(prev => ({ ...prev, totalQuizzes: prev.totalQuizzes + 1 }));
  };

  const handleComplete = (score) => {
    const message = score >= 80 ? '🎉 Excellent work!' : score >= 60 ? '👍 Good job!' : '💪 Keep practicing!';
    alert(`${message} Your score: ${score}%`);
    setSelectedQuiz(null);
    setStats(prev => ({ 
      ...prev, 
      completedQuizzes: prev.completedQuizzes + 1,
      averageScore: Math.round((prev.averageScore * prev.completedQuizzes + score) / (prev.completedQuizzes + 1))
    }));
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedQuiz) {
    return <QuizTaker quiz={selectedQuiz} onComplete={handleComplete} onBack={() => setSelectedQuiz(null)} />;
  }

  if (showGenerator) {
    return <QuizGenerator onGenerated={handleGenerated} onCancel={() => setShowGenerator(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Dashboard</h1>
          <p className="text-gray-600">Track your progress and challenge yourself with new quizzes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
              <BookOpen className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedQuizzes}</p>
              </div>
              <Trophy className="h-12 w-12 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900">{stats.streak}</p>
              </div>
              <Star className="h-12 w-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={() => setShowGenerator(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Quiz
            </button>
          </div>
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchQuizzes}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No quizzes found</h3>
            <p className="text-gray-500">Try adjusting your search or create a new quiz to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div 
                key={quiz._id} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                onClick={() => setSelectedQuiz(quiz)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex-1">{quiz.topic}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{quiz.questions} questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{quiz.timeLimit} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Avg. Score: {quiz.averageScore}%</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                    <Play className="h-5 w-5" />
                    Start Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance Tracker */}
        <div className="mt-8">
          <PerformanceTracker />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;