import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import QuizTaker from './components/QuizTaker';
import CompleteQuiz from './components/CompleteQuiz.jsx';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => setIsLoggedIn(true);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={isLoggedIn ? <Dashboard /> : <Login onLogin={handleLogin} />} />
        <Route path='/quiz-taker' element={<QuizTaker />} />
        <Route path='/complete-quiz' element={<CompleteQuiz />} />
      </Routes>
    </Router>
  );
};

export default App;