// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: 50,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  preferences: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    subjects: [String],
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  stats: {
    totalQuizzes: { type: Number, default: 0 },
    completedQuizzes: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    streak: { type: Number, default: 0 },
    lastQuizDate: Date,
    bestSubject: String,
    weakestSubject: String
  },
  lastLogin: Date,
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
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'stats.totalQuizzes': -1 });

// Virtual for user level based on completed quizzes
userSchema.virtual('level').get(function() {
  const completed = this.stats.completedQuizzes;
  if (completed < 5) return 'Beginner';
  if (completed < 20) return 'Intermediate';
  if (completed < 50) return 'Advanced';
  return 'Expert';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Update user statistics
userSchema.methods.updateStats = function(quizData) {
  this.stats.totalQuizzes += 1;
  if (quizData.completed) {
    this.stats.completedQuizzes += 1;
    
    // Update average score
    const totalScore = this.stats.averageScore * (this.stats.completedQuizzes - 1) + quizData.score;
    this.stats.averageScore = Math.round(totalScore / this.stats.completedQuizzes);
    
    // Update time spent
    this.stats.totalTimeSpent += quizData.timeSpent || 0;
    
    // Update streak
    const today = new Date().toDateString();
    const lastQuizDate = this.stats.lastQuizDate ? this.stats.lastQuizDate.toDateString() : null;
    
    if (lastQuizDate === today) {
      // Same day, don't change streak
    } else if (this.isConsecutiveDay(lastQuizDate)) {
      this.stats.streak += 1;
    } else {
      this.stats.streak = 1;
    }
    
    this.stats.lastQuizDate = new Date();
  }
};

userSchema.methods.isConsecutiveDay = function(lastQuizDate) {
  if (!lastQuizDate) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toDateString() === lastQuizDate;
};

module.exports = mongoose.model('User', userSchema);

