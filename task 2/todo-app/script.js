// Interactive To-Do List — script.js
// Demonstrates DOM manipulation, events, and localStorage.

// Selectors
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const addTaskBtn = document.querySelector('#add-task-btn');
const taskList = document.querySelector('#task-list');
const taskCount = document.querySelector('#task-count');
const emptyState = document.querySelector('#empty-state');
const clearCompletedBtn = document.querySelector('#clear-completed-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

// App state
let tasks = []; // array of {id, text, completed}
let currentFilter = 'all';
const STORAGE_KEY = 'todo_tasks_v1';

// Load tasks on startup
loadTasks();
renderTasks();

// Event listeners
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask();
});

// Allow Enter key in input to add task as well (form submit handles it)

clearCompletedBtn.addEventListener('click', () => {
  clearCompleted();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    filterTasks(currentFilter);
  });
});

// Adds a new task based on input value
function addTask(){
  const text = taskInput.value.trim();
  if(!text){
    showError('Please enter a task before adding.');
    return;
  }
  const newTask = { id: Date.now().toString(), text, completed: false };
  tasks.push(newTask);
  saveTasks();
  const el = createTaskElement(newTask);
  taskList.appendChild(el);
  el.classList.add('fade-in');
  taskInput.value = '';
  updateTaskCount();
  hideEmptyStateIfNeeded();
}

// Create DOM structure for a single task using DOM methods
function createTaskElement(task){
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex align-items-center';
  li.dataset.id = task.id;

  const left = document.createElement('div');
  left.className = 'task-left';

  // checkbox
  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'form-check';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'form-check-input';
  checkbox.checked = task.completed;
  checkbox.title = 'Mark task completed';
  checkbox.addEventListener('change', () => toggleTask(task.id));
  checkboxWrapper.appendChild(checkbox);

  // text
  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text;
  if(task.completed) textSpan.classList.add('completed');

  left.appendChild(checkboxWrapper);
  left.appendChild(textSpan);

  // actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-outline-secondary btn-icon';
  editBtn.textContent = 'Edit';
  editBtn.title = 'Edit task';
  editBtn.addEventListener('click', () => editTask(task.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-outline-danger btn-icon';
  deleteBtn.textContent = 'Delete';
  deleteBtn.title = 'Delete task';
  deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

// Toggle completed state
function toggleTask(id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  t.completed = !t.completed;
  saveTasks();
  renderTasks();
}

// Edit a task in-place
function editTask(id){
  const li = taskList.querySelector(`li[data-id="${id}"]`);
  if(!li) return;
  const span = li.querySelector('.task-text');
  const editBtn = li.querySelector('.btn-outline-secondary');

  // If already editing (button label Save), save changes
  if(editBtn.textContent.toLowerCase() === 'save'){
    const input = li.querySelector('input.edit-input');
    const newText = input.value.trim();
    if(!newText){ showError('Task cannot be empty.'); return; }
    span.textContent = newText;
    editBtn.textContent = 'Edit';
    input.replaceWith(span);
    // update state
    const t = tasks.find(x => x.id === id);
    if(t){ t.text = newText; saveTasks(); updateTaskCount(); }
    return;
  }

  // Replace span with input
  const input = document.createElement('input');
  input.className = 'form-control form-control-sm edit-input';
  input.value = span.textContent;
  li.querySelector('.task-left').replaceChild(input, span);
  editBtn.textContent = 'Save';
  input.focus();
  // allow Enter to save
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') editBtn.click();
  });
}

// Delete task with animation
function deleteTask(id, liElement){
  // animate removal
  liElement.classList.add('fade-out');
  liElement.addEventListener('animationend', () => {
    liElement.remove();
  });
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  updateTaskCount();
  hideEmptyStateIfNeeded();
}

// Filter tasks by currentFilter
function filterTasks(filter){
  const items = taskList.querySelectorAll('li');
  items.forEach(li => {
    const id = li.dataset.id;
    const t = tasks.find(x => x.id === id);
    if(!t) return;
    let shouldShow = true;
    if(filter === 'active') shouldShow = !t.completed;
    if(filter === 'completed') shouldShow = t.completed;
    li.style.display = shouldShow ? '' : 'none';
  });
  updateTaskCount();
}

// Update the task counter
function updateTaskCount(){
  const remaining = tasks.filter(t => !t.completed).length;
  const text = `${remaining} task${remaining === 1 ? '' : 's'} remaining`;
  taskCount.textContent = text;
}

// Save to localStorage
function saveTasks(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }catch(e){
    console.error('Could not save tasks', e);
  }
}

// Load from localStorage
function loadTasks(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) tasks = JSON.parse(raw);
    else tasks = [];
  }catch(e){
    console.error('Could not load tasks', e);
    tasks = [];
  }
}

// Re-render all tasks (used after load or major updates)
function renderTasks(){
  taskList.innerHTML = '';
  if(tasks.length === 0){
    showEmptyState();
    updateTaskCount();
    return;
  }
  hideEmptyStateIfNeeded();
  tasks.forEach(t => {
    const el = createTaskElement(t);
    taskList.appendChild(el);
  });
  filterTasks(currentFilter);
  updateTaskCount();
}

function clearCompleted(){
  const before = tasks.length;
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
  const removed = before - tasks.length;
  if(removed === 0){ showError('No completed tasks to clear.'); }
}

function showEmptyState(){
  emptyState.style.display = '';
}

function hideEmptyStateIfNeeded(){
  emptyState.style.display = tasks.length === 0 ? '' : 'none';
}

// Small transient error message in the empty-state area
function showError(msg){
  const prev = document.querySelector('.error-msg');
  if(prev) prev.remove();
  const div = document.createElement('div');
  div.className = 'error-msg text-danger small mt-2';
  div.textContent = msg;
  const card = document.querySelector('.app-card .card-body');
  card.insertBefore(div, card.firstChild);
  setTimeout(() => div.remove(), 3000);
}
