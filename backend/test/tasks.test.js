const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import models
const User = require('../models/User');
const Task = require('../models/Task');

// Import server
const server = require('../server');

// Configure chai
chai.use(chaiHttp);

describe('Tasks API', function() {
  // Test user data
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  // Test task data
  const testTask = {
    title: 'Test Task',
    description: 'This is a test task',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    priority: 'média',
    assignee: 'Test User',
    status: 'pendente'
  };

  let token;
  let userId;
  let taskId;

  // Before all tests, create a test user
  before(async function() {
    // Clear users and tasks collections
    await User.deleteMany({});
    await Task.deleteMany({});

    // Create a test user
    const user = new User(testUser);
    await user.save();
    userId = user._id;

    // Generate token
    const payload = {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );
  });

  // After all tests, clean up
  after(async function() {
    await User.deleteMany({});
    await Task.deleteMany({});
  });

  // Test GET /api/tasks
  describe('GET /api/tasks', function() {
    it('should get all tasks for the authenticated user', function(done) {
      chai.request(server)
        .get('/api/tasks')
        .set('x-auth-token', token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('should return 401 if no token is provided', function(done) {
      chai.request(server)
        .get('/api/tasks')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  // Test POST /api/tasks
  describe('POST /api/tasks', function() {
    it('should create a new task', function(done) {
      chai.request(server)
        .post('/api/tasks')
        .set('x-auth-token', token)
        .send({
          ...testTask,
          user: userId
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('_id');
          expect(res.body).to.have.property('title', testTask.title);
          taskId = res.body._id; // Save task ID for later tests
          done();
        });
    });

    it('should return 400 if required fields are missing', function(done) {
      chai.request(server)
        .post('/api/tasks')
        .set('x-auth-token', token)
        .send({
          description: 'Missing required fields'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  // Test GET /api/tasks/:id
  describe('GET /api/tasks/:id', function() {
    it('should get a task by ID', function(done) {
      chai.request(server)
        .get(`/api/tasks/${taskId}`)
        .set('x-auth-token', token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('_id', taskId.toString());
          expect(res.body).to.have.property('title', testTask.title);
          done();
        });
    });

    it('should return 404 if task not found', function(done) {
      const fakeId = new mongoose.Types.ObjectId();
      chai.request(server)
        .get(`/api/tasks/${fakeId}`)
        .set('x-auth-token', token)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  // Test PUT /api/tasks/:id
  describe('PUT /api/tasks/:id', function() {
    it('should update a task', function(done) {
      const updatedTask = {
        title: 'Updated Task Title',
        status: 'concluída'
      };

      chai.request(server)
        .put(`/api/tasks/${taskId}`)
        .set('x-auth-token', token)
        .send(updatedTask)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('title', updatedTask.title);
          expect(res.body).to.have.property('status', updatedTask.status);
          done();
        });
    });
  });

  // Test DELETE /api/tasks/:id
  describe('DELETE /api/tasks/:id', function() {
    it('should delete a task', function(done) {
      chai.request(server)
        .delete(`/api/tasks/${taskId}`)
        .set('x-auth-token', token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should return 404 if task not found', function(done) {
      chai.request(server)
        .delete(`/api/tasks/${taskId}`)
        .set('x-auth-token', token)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  // Test GET /api/tasks/stats/summary
  describe('GET /api/tasks/stats/summary', function() {
    it('should get task statistics', function(done) {
      chai.request(server)
        .get('/api/tasks/stats/summary')
        .set('x-auth-token', token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('totalTasks');
          expect(res.body).to.have.property('completedTasks');
          expect(res.body).to.have.property('pendingTasks');
          done();
        });
    });
  });
});