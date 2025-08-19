
// routes/quizRoutes.js
const express = require('express');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateQuiz, validatePagination } = require('../middleware/validationMiddleware');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

const router = express.Router();

// @desc    Get all quizzes with filtering, sorting, and pagination
// @route   GET /api/quizzes
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    // Build query
    const queryObj = { isPublic: true, isActive: true };
    
    // Filter by category
    if (req.query.category) {
      queryObj.category = new RegExp(req.query.category, 'i');
    }
    
    // Filter by difficulty
    if (req.query.difficulty) {
      queryObj.difficulty = req.query.difficulty;
    }
    
    // Search by title
    if (req.query.search) {
      queryObj.title = new RegExp(req.query.search, 'i');
    }
    
    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      queryObj.tags = { $in: tags };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Sorting
    let sort = '-createdAt'; // Default sort by newest
    if (req.query.sort) {
      const sortBy = req.query.sort;
      sort = sortBy === 'popular' ? '-stats.totalAttempts' : 
             sortBy === 'rating' ? '-stats.averageScore' :
             sortBy === 'oldest' ? 'createdAt' : '-createdAt';
    }

    // Cache key
    const cacheKey = `quizzes:${JSON.stringify(queryObj)}:${page}:${limit}:${sort}`;
    
    // Check cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Execute query
    const quizzes = await Quiz.find(queryObj)
      .populate('creator', 'name')
      .select('-questions.explanation') // Don't send explanations in list view
      .sort(sort)
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count for pagination
    const total = await Quiz.countDocuments(queryObj);

    // Pagination result
    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    const result = {
      success: true,
      count: quizzes.length,
      total,
      pagination,
      data: quizzes
    };

    // Cache the result for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get quizzes error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching quizzes'
    });
  }
});

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('creator', 'name email');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if quiz is public or user is the creator
    if (!quiz.isPublic && (!req.user || req.user._id.toString() !== quiz.creator._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is private'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    logger.error(`Get quiz error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz'
    });
  }
});

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private
router.post('/', protect, validateQuiz, async (req, res) => {
  try {
    // Add creator to req.body
    req.body.creator = req.user._id;

    const quiz = await Quiz.create(req.body);
    
    // Populate creator info
    await quiz.populate('creator', 'name email');

    logger.info(`Quiz created: ${quiz.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    logger.error(`Create quiz error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error creating quiz'
    });
  }
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private
router.put('/:id', protect, validateQuiz, async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quiz'
      });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('creator', 'name email');

    logger.info(`Quiz updated: ${quiz.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    logger.error(`Update quiz error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating quiz'
    });
  }
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    // Soft delete - just mark as inactive
    quiz.isActive = false;
    await quiz.save();

    logger.info(`Quiz deleted: ${quiz.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete quiz error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting quiz'
    });
  }
});

// @desc    Start quiz attempt
// @route   POST /api/quizzes/:id/start
// @access  Private
router.post('/:id/start', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or inactive'
      });
    }

    // Check if quiz is public or user has access
    if (!quiz.isPublic && quiz.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this quiz'
      });
    }

    // Create new attempt
    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      answers: [],
      score: 0,
      totalPoints: quiz.totalPoints,
      earnedPoints: 0,
      timeSpent: 0,
      startedAt: new Date()
    });

    // Update quiz stats
    quiz.stats.totalAttempts += 1;
    await quiz.save();

    logger.info(`Quiz attempt started: ${quiz.title} by ${req.user.email}`);

    // Return quiz without correct answers for security
    const quizData = {
      ...quiz.toObject(),
      questions: quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options.map(o => ({ text: o.text })), // Remove isCorrect
        points: q.points
      }))
    };

    res.status(201).json({
      success: true,
      message: 'Quiz attempt started',
      data: {
        attemptId: attempt._id,
        quiz: quizData,
        timeLimit: quiz.timeLimit,
        startedAt: attempt.startedAt
      }
    });
  } catch (error) {
    logger.error(`Start quiz attempt error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error starting quiz attempt'
    });
  }
});

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { attemptId, answers, timeSpent } = req.body;

    if (!attemptId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Attempt ID and answers are required'
      });
    }

    const attempt = await QuizAttempt.findById(attemptId)
      .populate('quiz');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    // Check ownership
    if (attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this attempt'
      });
    }

    // Check if already completed
    if (attempt.completed) {
      return res.status(400).json({
        success: false,
        message: 'Quiz attempt already completed'
      });
    }

    const quiz = attempt.quiz;
    let earnedPoints = 0;
    const processedAnswers = [];

    // Process each answer
    answers.forEach(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (question) {
        const selectedOption = question.options[answer.selectedOption];
        const isCorrect = selectedOption && selectedOption.isCorrect;
        
        if (isCorrect) {
          earnedPoints += question.points;
        }

        processedAnswers.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect,
          timeSpent: answer.timeSpent || 0
        });
      }
    });

    // Calculate score percentage
    const score = Math.round((earnedPoints / quiz.totalPoints) * 100);

    // Update attempt
    attempt.answers = processedAnswers;
    attempt.earnedPoints = earnedPoints;
    attempt.score = score;
    attempt.timeSpent = timeSpent || 0;
    attempt.completed = true;
    attempt.completedAt = new Date();

    await attempt.save();

    // Update quiz statistics
    quiz.updateStats({
      completed: true,
      score,
      timeSpent: timeSpent || 0
    });
    await quiz.save();

    // Update user statistics
    req.user.updateStats({
      completed: true,
      score,
      timeSpent: timeSpent || 0
    });
    await req.user.save();

    logger.info(`Quiz completed: ${quiz.title} by ${req.user.email}, Score: ${score}%`);

    // Prepare detailed results
    const results = {
      attemptId: attempt._id,
      score,
      earnedPoints,
      totalPoints: quiz.totalPoints,
      timeSpent,
      passed: score >= (quiz.settings.passingScore || 60),
      answers: quiz.settings.showCorrectAnswers ? processedAnswers.map(ans => {
        const question = quiz.questions.id(ans.questionId);
        return {
          questionId: ans.questionId,
          question: question.question,
          selectedOption: ans.selectedOption,
          correctOption: question.options.findIndex(opt => opt.isCorrect),
          isCorrect: ans.isCorrect,
          explanation: question.explanation
        };
      }) : undefined
    };

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: results
    });
  } catch (error) {
    logger.error(`Submit quiz attempt error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz attempt'
    });
  }
});

// @desc    Get user's quiz attempts
// @route   GET /api/quizzes/attempts
// @access  Private
router.get('/attempts/me', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const attempts = await QuizAttempt.find({ 
      user: req.user._id,
      completed: true 
    })
      .populate('quiz', 'title category difficulty')
      .sort('-completedAt')
      .limit(limit * 1)
      .skip(startIndex);

    const total = await QuizAttempt.countDocuments({ 
      user: req.user._id,
      completed: true 
    });

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
      count: attempts.length,
      total,
      pagination,
      data: attempts
    });
  } catch (error) {
    logger.error(`Get attempts error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz attempts'
    });
  }
});

module.exports = router;