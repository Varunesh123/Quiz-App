// routes/analyticsRoutes.js
const express = require('express');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

const userAnalyticsCache = new Map();

// @desc    Get user analytics
// @route   GET /api/analytics/user
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Cache key
    const cacheKey = `analytics:user:${req.user._id}:${timeframe}`;
    const cached = userAnalyticsCache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get user's attempts in timeframe
    const attempts = await QuizAttempt.find({
      user: req.user._id,
      completed: true,
      completedAt: { $gte: startDate }
    }).populate('quiz', 'title category difficulty');

    // Calculate analytics
    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0 
      ? Math.round(attempts.reduce((sum, att) => sum + att.score, 0) / totalAttempts)
      : 0;
    
    const totalTimeSpent = attempts.reduce((sum, att) => sum + att.timeSpent, 0);
    
    // Performance by category
    const categoryStats = {};
    const difficultyStats = { easy: [], medium: [], hard: [] };
    
    attempts.forEach(attempt => {
      const category = attempt.quiz.category;
      const difficulty = attempt.quiz.difficulty;
      
      if (!categoryStats[category]) {
        categoryStats[category] = { attempts: 0, totalScore: 0, averageScore: 0 };
      }
      
      categoryStats[category].attempts += 1;
      categoryStats[category].totalScore += attempt.score;
      categoryStats[category].averageScore = Math.round(
        categoryStats[category].totalScore / categoryStats[category].attempts
      );
      
      difficultyStats[difficulty].push(attempt.score);
    });

    // Find strengths and weaknesses
    const categoryArray = Object.entries(categoryStats)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.averageScore - a.averageScore);
    
    const strengths = categoryArray.slice(0, 3);
    const weaknesses = categoryArray.slice(-3).reverse();

    // Daily performance chart data
    const dailyPerformance = [];
    const dailyMap = new Map();
    
    attempts.forEach(attempt => {
      const date = attempt.completedAt.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, scores: [], count: 0 });
      }
      const dayData = dailyMap.get(date);
      dayData.scores.push(attempt.score);
      dayData.count += 1;
    });
    
    dailyMap.forEach(dayData => {
      dailyPerformance.push({
        date: dayData.date,
        averageScore: Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length),
        quizCount: dayData.count
      });
    });
    
    dailyPerformance.sort((a, b) => new Date(a.date) - new Date(b.date));

    const analytics = {
      success: true,
      data: {
        timeframe,
        overview: {
          totalAttempts,
          averageScore,
          totalTimeSpent,
          improvementRate: calculateImprovement(attempts)
        },
        categoryPerformance: categoryArray,
        difficultyPerformance: {
          easy: calculateDifficultyStats(difficultyStats.easy),
          medium: calculateDifficultyStats(difficultyStats.medium),
          hard: calculateDifficultyStats(difficultyStats.hard)
        },
        strengths,
        weaknesses,
        dailyPerformance,
        recommendations: generateRecommendations(categoryArray, req.user.stats)
      }
    };

    // Cache for 15 minutes
    userAnalyticsCache.set(cacheKey, analytics);
    setTimeout(() => userAnalyticsCache.delete(cacheKey), 900 * 1000);

    res.status(200).json(analytics);
  } catch (error) {
    logger.error(`Get user analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics'
    });
  }
});

// @desc    Get quiz analytics (for quiz creators)
// @route   GET /api/analytics/quiz/:id
// @access  Private
router.get('/quiz/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user is creator or admin
    if (quiz.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view quiz analytics'
      });
    }

    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({
      quiz: req.params.id,
      completed: true
    }).populate('user', 'name email');

    // Calculate analytics
    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, att) => sum + att.score, 0) / totalAttempts)
      : 0;
    
    const averageTime = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, att) => sum + att.timeSpent, 0) / totalAttempts)
      : 0;

    const passRate = totalAttempts > 0
      ? Math.round((attempts.filter(att => att.score >= (quiz.settings.passingScore || 60)).length / totalAttempts) * 100)
      : 0;

    // Score distribution
    const scoreDistribution = {
      '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
    };
    
    attempts.forEach(attempt => {
      const score = attempt.score;
      if (score <= 20) scoreDistribution['0-20']++;
      else if (score <= 40) scoreDistribution['21-40']++;
      else if (score <= 60) scoreDistribution['41-60']++;
      else if (score <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    });

    // Question analytics
    const questionAnalytics = quiz.questions.map(question => {
      const questionAttempts = attempts.filter(att => 
        att.answers.some(ans => ans.questionId.toString() === question._id.toString())
      );
      
      const correctAnswers = questionAttempts.filter(att =>
        att.answers.find(ans => ans.questionId.toString() === question._id.toString())?.isCorrect
      ).length;
      
      return {
        questionId: question._id,
        question: question.question.substring(0, 50) + '...',
        totalAttempts: questionAttempts.length,
        correctAnswers,
        successRate: questionAttempts.length > 0 
          ? Math.round((correctAnswers / questionAttempts.length) * 100)
          : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          difficulty: quiz.difficulty
        },
        overview: {
          totalAttempts,
          averageScore,
          averageTime,
          passRate
        },
        scoreDistribution,
        questionAnalytics: questionAnalytics.sort((a, b) => a.successRate - b.successRate),
        recentAttempts: attempts.slice(-10).reverse().map(att => ({
          user: att.user.name,
          score: att.score,
          timeSpent: att.timeSpent,
          completedAt: att.completedAt
        }))
      }
    });
  } catch (error) {
    logger.error(`Get quiz analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz analytics'
    });
  }
});

// Helper functions
function calculateDifficultyStats(scores) {
  if (scores.length === 0) return { averageScore: 0, attempts: 0 };
  
  return {
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    attempts: scores.length
  };
}

function calculateImprovement(attempts) {
  if (attempts.length < 2) return 0;
  
  const sortedAttempts = attempts.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const firstHalf = sortedAttempts.slice(0, Math.floor(sortedAttempts.length / 2));
  const secondHalf = sortedAttempts.slice(Math.floor(sortedAttempts.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, att) => sum + att.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, att) => sum + att.score, 0) / secondHalf.length;
  
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

function generateRecommendations(categoryPerformance, userStats) {
  const recommendations = [];
  
  // Find weak categories
  const weakCategories = categoryPerformance.filter(cat => cat.averageScore < 70);
  if (weakCategories.length > 0) {
    recommendations.push({
      type: 'improvement',
      title: 'Focus on weak subjects',
      description: `Consider practicing more ${weakCategories[0].category} quizzes to improve your score from ${weakCategories[0].averageScore}%`
    });
  }
  
  // Check overall performance
  if (userStats.averageScore > 80) {
    recommendations.push({
      type: 'challenge',
      title: 'Try harder difficulty',
      description: 'Your performance is excellent! Consider challenging yourself with harder difficulty quizzes.'
    });
  }
  
  // Check consistency
  if (userStats.streak < 3) {
    recommendations.push({
      type: 'consistency',
      title: 'Build a learning streak',
      description: 'Try to take quizzes regularly to build knowledge retention and improve your learning streak.'
    });
  }
  
  return recommendations;
}

module.exports = router;