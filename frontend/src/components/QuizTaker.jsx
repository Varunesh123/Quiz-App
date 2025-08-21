import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, CheckCircle } from 'lucide-react';

const QuizTaker = ({ quiz, onSubmit, onBack, attemptId, onStatsUpdate }) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize answers array when quiz is defined
  useEffect(() => {
    if (quiz && quiz.questions && Array.isArray(quiz.questions)) {
      setAnswers(new Array(quiz.questions.length).fill(null));
    } else {
      setError('Invalid quiz data. Please try again.');
    }
  }, [quiz]);

  // Timer for tracking time spent
  useEffect(() => {
    if (!quiz || !quiz.timeLimit) return;

    const timer = setInterval(() => {
      setTimeSpent(prev => {
        const newTime = prev + 1;
        if (newTime >= quiz.timeLimit * 60) {
          setIsTimeUp(true);
          setSubmitting(true);
          handleSubmit();
          clearInterval(timer);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);

  const handleAnswer = (optionIndex) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = optionIndex;
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz?.questions?.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !quiz._id) {
      setError('Cannot submit quiz: Invalid quiz data');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = answers.map((selectedOption, index) => ({
        questionId: quiz.questions[index]._id,
        selectedOption: selectedOption !== null ? selectedOption : -1
      }));

      const response = await onSubmit(formattedAnswers, timeSpent);
      if (response.data.success) {
        const { score, earnedPoints, totalPoints, passed, answers: resultAnswers } = response.data.data;
        if (onStatsUpdate) {
          onStatsUpdate();
        }
        navigate('/complete-quiz', {
          state: {
            score,
            earnedPoints,
            totalPoints,
            passed,
            quizId: quiz._id,
            attemptId,
            quizTitle: quiz.title || 'Unnamed Quiz',
            totalQuestions: quiz.questions?.length || 0,
            timeSpent,
            answers: resultAnswers
          }
        });
      } else {
        throw new Error(response.data.message || 'Failed to submit quiz');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'No quiz data available. Please select a quiz from the dashboard.'}</p>
          <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const timeRemaining = Math.max(0, quiz.timeLimit * 60 - timeSpent);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{quiz.title || 'Unnamed Quiz'}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span>
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </span>
            </div>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
              disabled={isTimeUp || submitting}
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600 mt-2">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>

        {isTimeUp ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Time's Up!</h3>
            <p className="text-gray-600 mb-6">The quiz is being submitted automatically.</p>
            {submitting && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {currentQuestion.question}
              </h3>
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      checked={answers[currentQuestionIndex] === index}
                      onChange={() => handleAnswer(index)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                      disabled={isTimeUp || submitting}
                    />
                    <span className="text-gray-700">{option.text}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                disabled={isFirstQuestion || submitting}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Previous
              </button>
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || answers.some(answer => answer === null)}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={submitting || answers[currentQuestionIndex] === null}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizTaker;