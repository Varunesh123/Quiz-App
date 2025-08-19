// Basic test example - tests/auth.test.js

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Authentication Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });
});

console.log('🚀 Optimized Quiz Backend API Complete!');
console.log('📁 Features included:');
console.log('  ✅ JWT Authentication & Authorization');
console.log('  ✅ MongoDB with Mongoose ODM');
console.log('  ✅ Redis Caching');
console.log('  ✅ Rate Limiting & Security');
console.log('  ✅ Input Validation & Sanitization');
console.log('  ✅ Comprehensive Error Handling');
console.log('  ✅ Structured Logging');
console.log('  ✅ Performance Analytics');
console.log('  ✅ Leaderboards & Achievements');
console.log('  ✅ Database Indexing & Optimization');
console.log('  ✅ Docker Support');
console.log('  ✅ Test Framework Setup');
console.log('  ✅ Production Ready Configuration');
  
      