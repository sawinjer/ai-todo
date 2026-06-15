const express = require('express');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');

const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redis.on('error', (err) => console.error('Redis error:', err));
redis.connect();

const TODOS_KEY = 'todos';

app.get('/api/todos', async (req, res) => {
  const data = await redis.get(TODOS_KEY);
  res.json(data ? JSON.parse(data) : []);
});

app.post('/api/todos', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const data = await redis.get(TODOS_KEY);
  const todos = data ? JSON.parse(data) : [];
  const todo = { id: uuidv4(), text: text.trim(), done: false, createdAt: Date.now() };
  todos.push(todo);
  await redis.set(TODOS_KEY, JSON.stringify(todos));
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', async (req, res) => {
  const data = await redis.get(TODOS_KEY);
  const todos = data ? JSON.parse(data) : [];
  const todo = todos.find((t) => t.id === req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });

  if (typeof req.body.done === 'boolean') todo.done = req.body.done;
  if (req.body.text?.trim()) todo.text = req.body.text.trim();
  await redis.set(TODOS_KEY, JSON.stringify(todos));
  res.json(todo);
});

app.delete('/api/todos/:id', async (req, res) => {
  const data = await redis.get(TODOS_KEY);
  const todos = data ? JSON.parse(data) : [];
  const filtered = todos.filter((t) => t.id !== req.params.id);
  if (filtered.length === todos.length) return res.status(404).json({ error: 'not found' });
  await redis.set(TODOS_KEY, JSON.stringify(filtered));
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
