const API = '/api/todos';
let todos = [];
let filter = 'all';

const list = document.getElementById('list');
const input = document.getElementById('input');
const empty = document.querySelector('.empty');
const form = document.getElementById('add-form');

async function load() {
  const res = await fetch(API);
  todos = await res.json();
  render();
}

function visible() {
  if (filter === 'active') return todos.filter((t) => !t.done);
  if (filter === 'done') return todos.filter((t) => t.done);
  return todos;
}

function render() {
  const items = visible();
  empty.classList.toggle('hidden', items.length > 0);
  list.innerHTML = '';
  items.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.innerHTML = `
      <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${todo.id}" />
      <span class="todo-text">${escHtml(todo.text)}</span>
      <button class="delete-btn" data-id="${todo.id}" title="Delete">✕</button>
    `;
    list.appendChild(li);
  });
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const todo = await res.json();
  todos.push(todo);
  render();
});

list.addEventListener('change', async (e) => {
  if (e.target.type !== 'checkbox') return;
  const id = e.target.dataset.id;
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: e.target.checked }),
  });
  const updated = await res.json();
  todos = todos.map((t) => (t.id === id ? updated : t));
  render();
});

list.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  todos = todos.filter((t) => t.id !== id);
  render();
});

document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

load();
