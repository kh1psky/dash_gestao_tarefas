const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');

// Middleware to authenticate token
const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'Não autorizado, token não fornecido' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Get all tasks for current user with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, startDate, endDate, search } = req.query;
    
    // Build filter object
    const filter = { user: req.user.id };
    
    // Add status filter if provided
    if (status && status !== 'todas') {
      filter.status = status;
    }
    
    // Add priority filter if provided
    if (priority && priority !== 'todas') {
      filter.priority = priority;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) {
        filter.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.dueDate.$lte = new Date(endDate);
      }
    }
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { assignee: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignee } = req.body;
    
    // Create new task
    const newTask = new Task({
      title,
      description,
      dueDate,
      priority,
      assignee,
      user: req.user.id,
      status: 'pendente'
    });
    
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignee, status } = req.body;
    
    // Find task by ID
    let task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Update task fields
    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;
    task.assignee = assignee || task.assignee;
    
    // Update status and set completedDate if task is completed
    if (status && status !== task.status) {
      task.status = status;
      if (status === 'concluída') {
        task.completedDate = new Date();
      } else {
        task.completedDate = undefined;
      }
    }
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find task by ID
    const task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    await task.remove();
    res.json({ message: 'Tarefa removida' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Mark task as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    // Find task by ID
    const task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Update task status and completedDate
    task.status = 'concluída';
    task.completedDate = new Date();
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get task statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ user: req.user.id });
    const completedTasks = await Task.countDocuments({ user: req.user.id, status: 'concluída' });
    const pendingTasks = await Task.countDocuments({ user: req.user.id, status: 'pendente' });
    
    // Get tasks by priority
    const highPriority = await Task.countDocuments({ user: req.user.id, priority: 'alta' });
    const mediumPriority = await Task.countDocuments({ user: req.user.id, priority: 'média' });
    const lowPriority = await Task.countDocuments({ user: req.user.id, priority: 'baixa' });
    
    // Get upcoming tasks (due in the next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingTasks = await Task.find({
      user: req.user.id,
      status: 'pendente',
      dueDate: { $gte: today, $lte: nextWeek }
    }).sort({ dueDate: 1 });
    
    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      priorities: {
        alta: highPriority,
        média: mediumPriority,
        baixa: lowPriority
      },
      upcomingTasks
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;