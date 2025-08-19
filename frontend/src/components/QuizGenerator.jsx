import { useState } from "react";

const QuizGenerator = ({ onGenerated, onCancel }) => {
  const [topic, setTopic] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic) {
      onGenerated({
        _id: Date.now().toString(),
        topic,
        difficulty: 'medium',
        questions: 10,
        averageScore: 0,
        timeLimit: 15,
        createdAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Create New Quiz</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter quiz topic"
          className="w-full p-3 border rounded-lg mb-4"
        />
        <div className="flex gap-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Generate Quiz
          </button>
          <button type="button" onClick={onCancel} className="bg-gray-300 px-6 py-2 rounded-lg">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizGenerator;
