// models/QuizAttempt.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  }
});

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [answerSchema],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    required: true
  },
  earnedPoints: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // in minutes
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  feedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
quizAttemptSchema.index({ user: 1, quiz: 1 });
quizAttemptSchema.index({ user: 1, completedAt: -1 });
quizAttemptSchema.index({ quiz: 1, score: -1 });
quizAttemptSchema.index({ createdAt: -1 });

// Virtual for percentage score
quizAttemptSchema.virtual('percentage').get(function() {
  return Math.round((this.earnedPoints / this.totalPoints) * 100);
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
