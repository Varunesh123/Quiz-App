// models/Quiz.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  explanation: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1
  },
  tags: [String]
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a quiz title'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String],
  stats: {
    totalAttempts: { type: Number, default: 0 },
    completedAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 }
  },
  settings: {
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    allowReview: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: true },
    passingScore: { type: Number, default: 60 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
quizSchema.index({ category: 1, difficulty: 1 });
quizSchema.index({ creator: 1 });
quizSchema.index({ createdAt: -1 });
quizSchema.index({ 'stats.totalAttempts': -1 });
quizSchema.index({ tags: 1 });
quizSchema.index({ isPublic: 1, isActive: 1 });

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Pre-save middleware to calculate total points
quizSchema.pre('save', function(next) {
  if (this.isModified('questions')) {
    this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  }
  next();
});

// Update quiz statistics
quizSchema.methods.updateStats = function(attemptData) {
  this.stats.totalAttempts += 1;
  
  if (attemptData.completed) {
    this.stats.completedAttempts += 1;
    
    // Update average score
    const totalScore = this.stats.averageScore * (this.stats.completedAttempts - 1) + attemptData.score;
    this.stats.averageScore = Math.round(totalScore / this.stats.completedAttempts);
    
    // Update average time spent
    const totalTime = this.stats.averageTimeSpent * (this.stats.completedAttempts - 1) + attemptData.timeSpent;
    this.stats.averageTimeSpent = Math.round(totalTime / this.stats.completedAttempts);
    
    // Update pass rate
    const passingScore = this.settings.passingScore || 60;
    const passCount = attemptData.score >= passingScore ? 1 : 0;
    this.stats.passRate = Math.round((this.stats.passRate * (this.stats.completedAttempts - 1) + passCount * 100) / this.stats.completedAttempts);
  }
};

module.exports = mongoose.model('Quiz', quizSchema);

