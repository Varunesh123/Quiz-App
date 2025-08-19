// utils/seedData.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      role: 'user'
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'Password123',
      role: 'user'
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'AdminPass123',
      role: 'admin'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await User.create(userData);
    createdUsers.push(user);
    console.log(`Created user: ${user.email}`);
  }
  
  return createdUsers;
};

const seedQuizzes = async (users) => {
  const quizzes = [
    {
      title: 'JavaScript Fundamentals',
      description: 'Test your knowledge of JavaScript basics',
      category: 'Programming',
      difficulty: 'easy',
      creator: users[0]._id,
      timeLimit: 15,
      questions: [
        {
          question: 'What is the correct way to declare a variable in JavaScript?',
          options: [
            { text: 'var x = 5;', isCorrect: true },
            { text: 'variable x = 5;', isCorrect: false },
            { text: 'v x = 5;', isCorrect: false },
            { text: 'declare x = 5;', isCorrect: false }
          ],
          explanation: 'Variables in JavaScript can be declared using var, let, or const keywords.',
          difficulty: 'easy',
          points: 1
        },
        {
          question: 'Which method is used to add an element to the end of an array?',
          options: [
            { text: 'push()', isCorrect: true },
            { text: 'add()', isCorrect: false },
            { text: 'append()', isCorrect: false },
            { text: 'insert()', isCorrect: false }
          ],
          explanation: 'The push() method adds one or more elements to the end of an array.',
          difficulty: 'easy',
          points: 1
        }
      ],
      isPublic: true
    },
    {
      title: 'React Components',
      description: 'Understanding React component lifecycle and hooks',
      category: 'Frontend',
      difficulty: 'medium',
      creator: users[1]._id,
      timeLimit: 20,
      questions: [
        {
          question: 'What hook is used to manage state in functional components?',
          options: [
            { text: 'useState', isCorrect: true },
            { text: 'useEffect', isCorrect: false },
            { text: 'useContext', isCorrect: false },
            { text: 'useReducer', isCorrect: false }
          ],
          explanation: 'useState is the hook used to add state to functional components.',
          difficulty: 'medium',
          points: 2
        },
        {
          question: 'When does useEffect run by default?',
          options: [
            { text: 'After every render', isCorrect: true },
            { text: 'Only on mount', isCorrect: false },
            { text: 'Only on unmount', isCorrect: false },
            { text: 'Never automatically', isCorrect: false }
          ],
          explanation: 'useEffect runs after every render by default, unless dependencies are specified.',
          difficulty: 'medium',
          points: 2
        }
      ],
      isPublic: true
    },
    {
      title: 'Node.js Advanced Concepts',
      description: 'Deep dive into Node.js internals and best practices',
      category: 'Backend',
      difficulty: 'hard',
      creator: users[2]._id,
      timeLimit: 30,
      questions: [
        {
          question: 'What is the Event Loop in Node.js?',
          options: [
            { text: 'A mechanism that handles asynchronous operations', isCorrect: true },
            { text: 'A loop that runs events continuously', isCorrect: false },
            { text: 'A way to handle HTTP requests', isCorrect: false },
            { text: 'A database connection pool', isCorrect: false }
          ],
          explanation: 'The Event Loop is Node.js mechanism for handling asynchronous operations.',
          difficulty: 'hard',
          points: 3
        }
      ],
      isPublic: true
    }
  ];

  const createdQuizzes = [];
  for (const quizData of quizzes) {
    const quiz = await Quiz.create(quizData);
    createdQuizzes.push(quiz);
    console.log(`Created quiz: ${quiz.title}`);
  }
  
  return createdQuizzes;
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Quiz.deleteMany({});
    await QuizAttempt.deleteMany({});

    console.log('Cleared existing data');

    // Seed users
    const users = await seedUsers();
    
    // Seed quizzes
    const quizzes = await seedQuizzes(users);

    console.log('Data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();