import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Clock, ArrowLeft, BookOpen } from 'lucide-react';

const CompleteQuiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, earnedPoints, totalPoints, passed, quizId, attemptId, quizTitle, totalQuestions, timeSpent, answers } = location.state || {};

  if (!location.state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">No quiz completion data available.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Trophy className={`h-16 w-16 mx-auto mb-4 ${passed ? 'text-green-500' : 'text-yellow-500'}`} />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
          <p className="text-xl text-gray-600">{quizTitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Score</h3>
            <p className="text-4xl font-bold text-blue-600">{score}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Points</h3>
            <p className="text-4xl font-bold text-blue-600">{earnedPoints}/{totalPoints}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Spent</h3>
            <p className="text-4xl font-bold text-blue-600">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className={`text-xl font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? 'Congratulations! You passed.' : 'Better luck next time!'}
          </p>
        </div>

        {answers && answers.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Answer Review</h3>
            {answers.map((answer, index) => (
              <div key={answer.questionId} className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-medium text-gray-900 mb-2">{index + 1}. {answer.question}</p>
                <p className="text-sm text-gray-600 mb-2">
                  Your Answer: {answer.selectedOption !== -1 ? answer.selectedOption + 1 : 'Not answered'}
                  {answer.isCorrect ? (
                    <span className="text-green-600 ml-2">Correct</span>
                  ) : (
                    <span className="text-red-600 ml-2">Incorrect (Correct: Option {answer.correctOption + 1})</span>
                  )}
                </p>
                {answer.explanation && (
                  <p className="text-sm text-gray-600">Explanation: {answer.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate(`/quiz/${quizId}/attempt`, { state: { quizId, attemptId } })}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteQuiz;