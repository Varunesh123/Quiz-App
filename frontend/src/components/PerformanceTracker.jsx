import { useState, useEffect } from "react";
import { BookOpen, TrendingUp, Clock, Star } from 'lucide-react';
import { getPerformance } from '../services/api';

const PerformanceTracker = () => {
  const [timeFrame, setTimeFrame] = useState('week');
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPerformanceData = async (selectedTimeFrame) => {
    try {
      setLoading(true);
      setError('');
      const response = await getPerformance(selectedTimeFrame);
      if (response.data.success) {
        setPerformanceData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch performance data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData(timeFrame);
  }, [timeFrame]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !performanceData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'No performance data available'}</p>
          <button
            onClick={() => fetchPerformanceData(timeFrame)}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, categoryPerformance, strengths, weaknesses, recommendations } = performanceData;

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
          <button
            onClick={() => setTimeFrame('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeFrame === 'year'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="text-center">
          <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{overview.totalAttempts}</h3>
          <p className="text-gray-600">Quizzes Completed</p>
        </div>

        <div className="text-center">
          <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{overview.averageScore}%</h3>
          <p className="text-gray-600">Average Score</p>
        </div>

        <div className="text-center">
          <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {Math.floor(overview.totalTimeSpent / 60)}m
          </h3>
          <p className="text-gray-600">Time Spent</p>
        </div>

        <div className="text-center">
          <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Star className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {overview.improvementRate >= 0 ? '+' : ''}{overview.improvementRate}%
          </h3>
          <p className="text-gray-600">Improvement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Strong Subjects</h3>
          <div className="space-y-3">
            {strengths.length > 0 ? (
              strengths.map((subject, index) => (
                <div key={subject.category} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">{subject.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-green-600 fill-current" />
                    <span className="text-sm text-green-600">{subject.averageScore}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No strong subjects identified yet.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
          <div className="space-y-3">
            {weaknesses.length > 0 ? (
              weaknesses.map((subject, index) => (
                <div key={subject.category} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-800">{subject.category}</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">{subject.averageScore}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No areas for improvement identified yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Personalized Recommendations</h3>
        {recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <p key={index} className="text-gray-700 mb-2">
              <strong>{rec.title}:</strong> {rec.description}
            </p>
          ))
        ) : (
          <p className="text-gray-700">No recommendations available yet. Keep taking quizzes to get personalized insights!</p>
        )}
      </div>
    </div>
  );
};

export default PerformanceTracker;