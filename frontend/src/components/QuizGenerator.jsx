import React, { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { generateQuiz } from '../services/api';

const QuizGenerator = ({ onGenerated, onCancel }) => {
  const [quizData, setQuizData] = useState({
    title: '',
    category: '',
    difficulty: 'medium',
    timeLimit: 30,
    isPublic: true,
    tags: '',
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      allowReview: true,
      showCorrectAnswers: true,
      passingScore: 60
    },
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    difficulty: 'medium',
    points: 1,
    explanation: '',
    tags: '',
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuizChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('settings.')) {
      const settingKey = name.split('.')[1];
      setQuizData(prev => ({
        ...prev,
        settings: { ...prev.settings, [settingKey]: type === 'checkbox' ? checked : Number(value) }
      }));
    } else {
      setQuizData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: field === 'isCorrect' ? value : value } : opt
      )
    }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  const removeOption = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    // Validate current question
    if (!currentQuestion.question.trim()) {
      setError('Question text is required');
      return;
    }
    if (currentQuestion.options.length < 2) {
      setError('At least two options are required per question');
      return;
    }
    if (!currentQuestion.options.some(opt => opt.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.text.trim())) {
      setError('All options must have text');
      return;
    }

    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          ...currentQuestion,
          tags: currentQuestion.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          options: currentQuestion.options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          }))
        }
      ]
    }));
    setCurrentQuestion({
      question: '',
      difficulty: 'medium',
      points: 1,
      explanation: '',
      tags: '',
      options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate quiz data
    if (!quizData.title.trim()) {
      setError('Quiz title is required');
      setLoading(false);
      return;
    }
    if (!quizData.category.trim()) {
      setError('Category is required');
      setLoading(false);
      return;
    }
    if (quizData.questions.length === 0) {
      setError('At least one question is required');
      setLoading(false);
      return;
    }
    if (quizData.timeLimit < 1) {
      setError('Time limit must be at least 1 minute');
      setLoading(false);
      return;
    }

    try {
      // Prepare payload matching Quiz schema
      const payload = {
        title: quizData.title,
        category: quizData.category,
        difficulty: quizData.difficulty,
        timeLimit: Number(quizData.timeLimit),
        isPublic: quizData.isPublic,
        tags: quizData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        settings: quizData.settings,
        questions: quizData.questions.map(q => ({
          question: q.question,
          difficulty: q.difficulty,
          points: Number(q.points),
          explanation: q.explanation || undefined,
          tags: q.tags,
          options: q.options
        }))
      };

      const response = await generateQuiz(payload);
      if (response.data.success) {
        onGenerated(response.data.data); // Pass the created quiz to parent
      } else {
        throw new Error(response.data.message || 'Failed to create quiz');
      }
    } catch (err) {
      setError(err.message || 'Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create New Quiz</h2>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quiz Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Quiz Details</h3>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={quizData.title}
                onChange={handleQuizChange}
                placeholder="Enter quiz title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={quizData.category}
                onChange={handleQuizChange}
                placeholder="Enter category (e.g., Programming, Math)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={quizData.difficulty}
                onChange={handleQuizChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                id="timeLimit"
                name="timeLimit"
                type="number"
                value={quizData.timeLimit}
                onChange={handleQuizChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="isPublic" className="flex items-center gap-2">
                <input
                  id="isPublic"
                  name="isPublic"
                  type="checkbox"
                  checked={quizData.isPublic}
                  onChange={handleQuizChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Make quiz public</span>
              </label>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={quizData.tags}
                onChange={handleQuizChange}
                placeholder="e.g., programming, javascript, beginner"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Settings</h4>
              <label className="flex items-center gap-2">
                <input
                  name="settings.shuffleQuestions"
                  type="checkbox"
                  checked={quizData.settings.shuffleQuestions}
                  onChange={handleQuizChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Shuffle Questions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="settings.shuffleOptions"
                  type="checkbox"
                  checked={quizData.settings.shuffleOptions}
                  onChange={handleQuizChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Shuffle Options</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="settings.allowReview"
                  type="checkbox"
                  checked={quizData.settings.allowReview}
                  onChange={handleQuizChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Allow Review After Completion</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="settings.showCorrectAnswers"
                  type="checkbox"
                  checked={quizData.settings.showCorrectAnswers}
                  onChange={handleQuizChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Show Correct Answers</span>
              </label>
              <div>
                <label htmlFor="settings.passingScore" className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  id="settings.passingScore"
                  name="settings.passingScore"
                  type="number"
                  value={quizData.settings.passingScore}
                  onChange={handleQuizChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Question Editor */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Add Question</h3>
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <input
                id="question"
                name="question"
                type="text"
                value={currentQuestion.question}
                onChange={handleQuestionChange}
                placeholder="Enter question"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="questionDifficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Question Difficulty
              </label>
              <select
                id="questionDifficulty"
                name="difficulty"
                value={currentQuestion.difficulty}
                onChange={handleQuestionChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                id="points"
                name="points"
                type="number"
                value={currentQuestion.points}
                onChange={handleQuestionChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (optional)
              </label>
              <textarea
                id="explanation"
                name="explanation"
                value={currentQuestion.explanation}
                onChange={handleQuestionChange}
                placeholder="Enter explanation for correct answer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                rows="4"
              />
            </div>

            <div>
              <label htmlFor="questionTags" className="block text-sm font-medium text-gray-700 mb-2">
                Question Tags (comma-separated, optional)
              </label>
              <input
                id="questionTags"
                name="tags"
                type="text"
                value={currentQuestion.tags}
                onChange={handleQuestionChange}
                placeholder="e.g., basics, concepts"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Options</h4>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center gap-4">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Correct</span>
                  </label>
                  {currentQuestion.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={loading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="h-5 w-5" />
                Add Option
              </button>
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              disabled={loading}
            >
              <Plus className="h-5 w-5" />
              Add Question to Quiz
            </button>
          </div>

          {/* Added Questions Preview */}
          {quizData.questions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Added Questions</h3>
              {quizData.questions.map((q, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{index + 1}. {q.question}</p>
                  <p className="text-sm text-gray-600">Difficulty: {q.difficulty}, Points: {q.points}</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    {q.options.map((opt, i) => (
                      <li key={i}>
                        {opt.text} {opt.isCorrect && <span className="text-green-600">(Correct)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Quiz...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Quiz
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizGenerator;