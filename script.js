
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskCategorySelect = document.getElementById('task-category');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');

const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const clearAllBtn = document.getElementById('clear-all-btn');

const pendingCountEl = document.getElementById('pending-count');
const completedCountEl = document.getElementById('completed-count');
const totalCountEl = document.getElementById('total-count');

const themeToggleBtn = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;


const STORAGE_KEY = 'dom-explorer-tasks';
let tasks = loadTasks();
let taskCounter = tasks.length
  ? Math.max(...tasks.map(t => t.id)) + 1
  : 1;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Could not read saved tasks, starting fresh.', err);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

taskForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  if (!title) return;

  const category = taskCategorySelect.value;

  const newTask = {
    id: taskCounter++,
    title: title,
    category: category,
    status: 'pending'
  };

  tasks.push(newTask);
  saveTasks();

  const card = buildTaskCard(newTask);
  taskList.prepend(card);

  updateEmptyState();
  updateStats();

  taskForm.reset();
  taskTitleInput.focus();
});


function buildTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';

  
  card.setAttribute('data-id', task.id);
  card.setAttribute('data-status', task.status);
  card.setAttribute('data-category', task.category);

  const main = document.createElement('div');
  main.className = 'task-main';

  const titleEl = document.createElement('h3');
  titleEl.className = 'task-title';
  const titleText = document.createTextNode(task.title);
  titleEl.appendChild(titleText);

  const badge = document.createElement('span');
  badge.className = 'task-category-badge';
  badge.textContent = task.category;

  main.append(titleEl, badge);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-edit';
  editBtn.type = 'button';
  editBtn.textContent = 'Edit';

  const completeBtn = document.createElement('button');
  completeBtn.className = 'btn-complete';
  completeBtn.type = 'button';
  completeBtn.textContent = task.status === 'completed' ? 'Undo' : 'Complete';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Delete';

  actions.append(editBtn, completeBtn, deleteBtn);

  card.append(main, actions);

  return card;
}

taskList.addEventListener('click', function (event) {
  const card = event.target.closest('.task-card');
  if (!card) return;

  const taskId = Number(card.getAttribute('data-id'));

  if (event.target.matches('.btn-delete')) {
    handleDelete(card, taskId);
  } else if (event.target.matches('.btn-complete')) {
    handleComplete(card, taskId);
  } else if (event.target.matches('.btn-edit')) {
    handleEdit(card, taskId);
  }
});

function handleDelete(card, taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks();
  card.remove(); // required method: remove()
  updateEmptyState();
  updateStats();
}

function handleComplete(card, taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.status = task.status === 'completed' ? 'pending' : 'completed';
  saveTasks();

  card.setAttribute('data-status', task.status);

  if (task.status === 'completed') {
    
    card.setAttribute('data-completed-at', new Date().toLocaleTimeString());
  } else if (card.hasAttribute('data-completed-at')) {
    
    card.removeAttribute('data-completed-at');
  }

  const completeBtn = card.querySelector('.btn-complete');
  completeBtn.textContent = task.status === 'completed' ? 'Undo' : 'Complete';

  updateStats();
}

function handleEdit(card, taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const titleEl = card.querySelector('.task-title');

  if (card.querySelector('.edit-input')) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';

 
  input.setAttribute('value', task.title);
t
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  function commitEdit() {
    const newTitle = input.value.trim() || task.title;
    task.title = newTitle;
    saveTasks();

    const newTitleEl = document.createElement('h3');
    newTitleEl.className = 'task-title';
    newTitleEl.appendChild(document.createTextNode(newTitle));

   
    input.replaceWith(newTitleEl);
  }

  input.addEventListener('blur', commitEdit);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') input.blur();
  });
}

searchInput.addEventListener('input', applyFilters);
filterCategory.addEventListener('change', applyFilters);

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;

  const cards = taskList.querySelectorAll('.task-card');
  cards.forEach(card => {
    const title = card.querySelector('.task-title').textContent.toLowerCase();
    const cardCategory = card.getAttribute('data-category');

    const matchesSearch = title.includes(query);
    const matchesCategory = category === 'all' || cardCategory === category;

    card.style.display = (matchesSearch && matchesCategory) ? '' : 'none';
  });
}

clearAllBtn.addEventListener('click', function () {
  if (tasks.length === 0) return;
  const confirmed = confirm('Delete all tasks? This cannot be undone.');
  if (!confirmed) return;

  tasks = [];
  saveTasks();
  taskList.replaceChildren(); // clears the container
  updateEmptyState();
  updateStats();
});

function updateStats() {
  const pending = tasks.filter(t => t.status === 'pending').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  pendingCountEl.textContent = pending;
  completedCountEl.textContent = completed;
  totalCountEl.textContent = tasks.length;
}

function updateEmptyState() {
 
  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.style.display = '';
  } else {
    emptyState.style.display = 'none';
  }
}

function renderInitialTasks() {
  const fragment = document.createDocumentFragment();

  [...tasks].reverse().forEach(task => {
    fragment.appendChild(buildTaskCard(task));
  });

  taskList.appendChild(fragment);

  updateEmptyState();
  updateStats();
}

renderInitialTasks();

const themeIcon = themeToggleBtn.querySelector('.theme-icon');
const themeLabel = themeToggleBtn.querySelector('.theme-label');

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('dom-explorer-theme', theme);

  themeToggleBtn.classList.toggle('is-light', theme === 'light');
  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
}

themeToggleBtn.addEventListener('click', function () {
 
  const current = htmlEl.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

const savedTheme = localStorage.getItem('dom-explorer-theme');
applyTheme(savedTheme === 'light' ? 'light' : 'dark');

const demoInput = document.getElementById('demo-input');
const compareBtn = document.getElementById('compare-btn');
const propValueOutput = document.getElementById('prop-value-output');
const attrValueOutput = document.getElementById('attr-value-output');

compareBtn.addEventListener('click', function () {
  
  const propertyValue = demoInput.value;

 
  const attributeValue = demoInput.getAttribute('value');

  propValueOutput.textContent = `"${propertyValue}"`;
  attrValueOutput.textContent = attributeValue === null ? 'null' : `"${attributeValue}"`;
});


const propagationModeSelect = document.getElementById('propagation-mode');
const grandparentEl = document.getElementById('grandparent');
const parentEl = document.getElementById('parent');
const childBtn = document.getElementById('child-button');
const logList = document.getElementById('propagation-log-list');

let activeListeners = [];

function logStep(label) {
  console.log(label);
  const li = document.createElement('li');
  li.textContent = label;
  logList.appendChild(li);
}

function clearListeners() {
  activeListeners.forEach(({ el, fn, useCapture }) => {
    el.removeEventListener('click', fn, useCapture);
  });
  activeListeners = [];
}

function attachBubblingDemo() {
  const onChild = () => logStep('Child');
  const onParent = () => logStep('Parent');
  const onGrandparent = () => logStep('Grandparent');

  childBtn.addEventListener('click', onChild, false);
  parentEl.addEventListener('click', onParent, false);
  grandparentEl.addEventListener('click', onGrandparent, false);

  activeListeners = [
    { el: childBtn, fn: onChild, useCapture: false },
    { el: parentEl, fn: onParent, useCapture: false },
    { el: grandparentEl, fn: onGrandparent, useCapture: false }
  ];
}

function attachCapturingDemo() {
  const onChild = () => logStep('Child');
  const onParent = () => logStep('Parent');
  const onGrandparent = () => logStep('Grandparent');

 
  childBtn.addEventListener('click', onChild, true);
  parentEl.addEventListener('click', onParent, true);
  grandparentEl.addEventListener('click', onGrandparent, true);

  activeListeners = [
    { el: childBtn, fn: onChild, useCapture: true },
    { el: parentEl, fn: onParent, useCapture: true },
    { el: grandparentEl, fn: onGrandparent, useCapture: true }
  ];
}

function setupPropagationDemo() {
  clearListeners();
  logList.replaceChildren(); // before() / after() are used elsewhere, this is the right tool here

  if (propagationModeSelect.value === 'bubble') {
    attachBubblingDemo();
  } else {
    attachCapturingDemo();
  }
}

propagationModeSelect.addEventListener('change', setupPropagationDemo);

childBtn.addEventListener('click', function () {
  console.log(`--- ${propagationModeSelect.value} phase click ---`);
});

setupPropagationDemo();

const formPanel = document.getElementById('task-form-panel');
let lastUpdatedNote = null;

taskForm.addEventListener('submit', function () {
  if (lastUpdatedNote) lastUpdatedNote.remove();

  lastUpdatedNote = document.createElement('p');
  lastUpdatedNote.className = 'panel-subtitle';
  lastUpdatedNote.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;


  formPanel.after(lastUpdatedNote);
});

const resultsHint = document.createElement('p');
resultsHint.className = 'panel-subtitle';
resultsHint.id = 'results-hint';
resultsHint.textContent = 'Showing all tasks';

taskList.before(resultsHint);

function updateResultsHint() {
  const visibleCount = [...taskList.querySelectorAll('.task-card')]
    .filter(card => card.style.display !== 'none').length;
  resultsHint.textContent = `Showing ${visibleCount} of ${tasks.length} task(s)`;
}

searchInput.addEventListener('input', updateResultsHint);
filterCategory.addEventListener('change', updateResultsHint);
taskList.addEventListener('click', updateResultsHint);
taskForm.addEventListener('submit', updateResultsHint);
clearAllBtn.addEventListener('click', updateResultsHint);
updateResultsHint();
