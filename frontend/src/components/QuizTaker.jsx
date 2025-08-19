import { useState } from "react";

const QuizTaker = ({ quiz, onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  
  const handleComplete = () => {
    const finalScore = Math.floor(Math.random() * 100);
    onComplete(finalScore);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{quiz.topic}</h2>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
          ← Back
        </button>
      </div>
      <p className="text-gray-600 mb-4">Question {currentQuestion + 1} of {quiz.questions}</p>
      <p className="mb-6">This is a sample question for the quiz.</p>
      <button 
        onClick={handleComplete}
        className="bg-green-600 text-white px-6 py-2 rounded-lg"
      >
        Complete Quiz
      </button>
    </div>
  );
};

export default QuizTaker;