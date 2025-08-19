// routes/userRoutes.js
const express = require('express');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validatePagination } = require('../middleware/validationMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'preferences'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    logger.info(`Profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          stats: user.stats
        }
      }
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @desc    Get user leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
router.get('/leaderboard', validatePagination, async (req, res) => {
  try {
    const { timeframe = 'all', category } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const startIndex = (page - 1) * limit;

    // Build aggregation pipeline
    let matchStage = {};
    
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        matchStage.completedAt = { $gte: startDate };
      }
    }

    const pipeline = [
      { $match: { completed: true, ...matchStage } },
      ...(category ? [
        { $lookup: { from: 'quizzes', localField: 'quiz', foreignField: '_id', as: 'quiz' } },
        { $match: { 'quiz.category': category } }
      ] : []),
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$score' },
          totalPoints: { $sum: '$earnedPoints' },
          bestScore: { $max: '$score' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalScore: 1,
          totalAttempts: 1,
          averageScore: { $round: ['$averageScore', 2] },
          totalPoints: 1,
          bestScore: 1
        }
      },
      { $sort: { averageScore: -1, totalPoints: -1 } },
      { $skip: startIndex },
      { $limit: limit }
    ];

    const leaderboard = await QuizAttempt.aggregate(pipeline);
    
    // Add rankings
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: startIndex + index + 1
    }));

    // Get total count for pagination
    const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
    const totalUsers = await QuizAttempt.aggregate([
      ...countPipeline,
      { $count: 'total' }
    ]);
    
    const total = totalUsers.length > 0 ? totalUsers[0].total : 0;

    // Build pagination
    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: rankedLeaderboard.length,
      total,
      pagination,
      data: rankedLeaderboard
    });
  } catch (error) {
    logger.error(`Get leaderboard error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
});

// @desc    Get user's achievements
// @route   GET /api/users/achievements
// @access  Private
router.get('/achievements', protect, async (req, res) => {
  try {
    const user = req.user;
    const attempts = await QuizAttempt.find({ 
      user: user._id, 
      completed: true 
    }).populate('quiz', 'category difficulty');

    // Calculate achievements
    const achievements = [];
    
    // First Quiz
    if (attempts.length >= 1) {
      achievements.push({
        id: 'first_quiz',
        name: 'Getting Started',
        description: 'Complete your first quiz',
        icon: '🎯',
        unlockedAt: attempts[0].completedAt,
        category: 'milestone'
      });
    }

    // Quiz Streaks
    if (user.stats.streak >= 7) {
      achievements.push({
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Complete quizzes for 7 consecutive days',
        icon: '🔥',
        unlockedAt: user.stats.lastQuizDate,
        category: 'streak'
      });
    }

    // Score achievements
    const perfectScores = attempts.filter(att => att.score === 100);
    if (perfectScores.length >= 1) {
      achievements.push({
        id: 'perfect_score',
        name: 'Perfectionist',
        description: 'Get a perfect score on any quiz',
        icon: '💯',
        unlockedAt: perfectScores[0].completedAt,
        category: 'performance'
      });
    }

    // Category mastery
    const categoryStats = {};
    attempts.forEach(attempt => {
      const category = attempt.quiz.category;
      if (!categoryStats[category]) {
        categoryStats[category] = [];
      }
      categoryStats[category].push(attempt.score);
    });

    Object.entries(categoryStats).forEach(([category, scores]) => {
      if (scores.length >= 5) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avgScore >= 90) {
          achievements.push({
            id: `master_${category.toLowerCase().replace(/\s+/g, '_')}`,
            name: `${category} Master`,
            description: `Maintain 90%+ average in ${category} quizzes`,
            icon: '🎓',
            unlockedAt: new Date(),
            category: 'mastery'
          });
        }
      }
    });

    // Volume achievements
    if (attempts.length >= 50) {
      achievements.push({
        id: 'quiz_veteran',
        name: 'Quiz Veteran',
        description: 'Complete 50 quizzes',
        icon: '⭐',
        unlockedAt: attempts[49].completedAt,
        category: 'volume'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalAchievements: achievements.length,
        achievements: achievements.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      }
    });
  } catch (error) {
    logger.error(`Get achievements error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements'
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Soft delete - deactivate account instead of permanent deletion
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.info(`Account deleted: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

module.exports = router;