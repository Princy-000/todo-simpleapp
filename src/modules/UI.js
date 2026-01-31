export class UI {
  constructor(todoManager) {
    this.todoManager = todoManager;
    this.currentProjectId = null;
    this.editingTodoId = null;
  }
  
  init() {
    console.log('✅ UI module initialized');
    this.renderProjects();
    this.renderTodos();
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', () => this.handleNewProject());
      console.log('✅ New Project button listener added');
    }
    
    const newTodoBtn = document.getElementById('new-todo-btn');
    if (newTodoBtn) {
      newTodoBtn.addEventListener('click', () => this.showTodoModal());
      console.log('✅ New Todo button listener added');
    }
  }
  
  showTodoModal() {
    this.editingTodoId = null;
    this.showModalWithData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      recurrence: 'none',
      recurrenceEndDate: ''
    }, 'Add New Todo');
  }
  
  showEditTodoModal(todo) {
    this.editingTodoId = todo.id;
    this.showModalWithData({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.getISODate() || new Date().toISOString().split('T')[0],
      priority: todo.priority,
      recurrence: todo.recurrence || 'none',
      recurrenceEndDate: todo.recurrenceEndDate ? todo.recurrenceEndDate.toISOString().split('T')[0] : ''
    }, 'Edit Todo');
  }
  
  showModalWithData(data, title) {
    const modal = document.getElementById('todo-modal');
    if (!modal) return;
    
    const modalTitle = modal.querySelector('h2');
    if (modalTitle) modalTitle.textContent = title;
    
    document.getElementById('todo-title').value = data.title;
    document.getElementById('todo-description').value = data.description;
    document.getElementById('todo-due-date').value = data.dueDate;
    document.getElementById('todo-priority').value = data.priority;
    
        if (document.getElementById('todo-recurrence')) document.getElementById('todo-recurrence').value = data.recurrence || 'none';
    if (document.getElementById('todo-recurrence-end')) document.getElementById('todo-recurrence-end').value = data.recurrenceEndDate || '';

    modal.style.display = 'flex';
    this.setupModalListeners();
    document.getElementById('todo-title').focus();
    console.log(`✅ Todo modal shown for: ${title}`);
  }
  
  setupModalListeners() {
    const modal = document.getElementById('todo-modal');
    const form = document.getElementById('todo-form');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    if (closeBtn) closeBtn.onclick = () => this.hideTodoModal();
    if (cancelBtn) cancelBtn.onclick = () => this.hideTodoModal();
    if (modal) modal.onclick = (e) => {
      if (e.target === modal) this.hideTodoModal();
    };
    if (form) form.onsubmit = (e) => {
      e.preventDefault();
      this.editingTodoId ? this.handleEditTodo() : this.handleAddTodo();
    };
  }
  
  hideTodoModal() {
    const modal = document.getElementById('todo-modal');
    if (modal) {
      modal.style.display = 'none';
      this.editingTodoId = null;
      const form = document.getElementById('todo-form');
      if (form) form.reset();
      console.log('✅ Todo modal hidden');
    }
  }
  
  handleAddTodo() {
    const todoData = this.getFormData();
    if (!todoData) return;
    const newTodo = this.todoManager.addTodoToCurrent(todoData);
    if (newTodo) {
      console.log(`✅ Created new todo: ${newTodo.title}`);
      this.hideTodoModal();
      this.renderTodos();
    } else {
      alert('Failed to create todo');
    }
  }
  
  handleEditTodo() {
    if (!this.editingTodoId) return;
    const todoData = this.getFormData();
    if (!todoData) return;
    if (this.todoManager.updateTodo(this.editingTodoId, todoData)) {
      console.log(`✅ Updated todo: ${todoData.title}`);
      this.hideTodoModal();
      this.renderTodos();
    } else {
      alert('Failed to update todo');
    }
  }
  
  getFormData() {
    const titleInput = document.getElementById('todo-title');
    const descriptionInput = document.getElementById('todo-description');
    const dueDateInput = document.getElementById('todo-due-date');
    const prioritySelect = document.getElementById('todo-priority');
    const recurrenceSelect = document.getElementById('todo-recurrence');
    const recurrenceEndInput = document.getElementById('todo-recurrence-end');
    
    if (!titleInput || !titleInput.value.trim()) {
      alert('Please enter a title for the todo');
      titleInput.focus();
      return null;
    }
    
    return {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      dueDate: dueDateInput.value || null,
      priority: prioritySelect.value,
      recurrence: recurrenceSelect ? recurrenceSelect.value : 'none',
      recurrenceEndDate: recurrenceEndInput ? recurrenceEndInput.value || null : null
    };
  }
  
  handleNewProject() {
    const projectName = prompt('Enter project name:');
    if (!projectName || projectName.trim() === '') {
      alert('Project name cannot be empty!');
      return;
    }
    const description = prompt('Enter project description (optional):') || '';
    const newProject = this.todoManager.createProject(projectName.trim(), description);
    if (newProject) {
      console.log(`✅ Created new project: ${newProject.name}`);
      this.renderProjects();
      this.selectProject(newProject.id);
      alert(`Project "${newProject.name}" created successfully!`);
    } else {
      alert('Failed to create project');
    }
  }
  
  handleEditProject(projectId) {
    const project = this.todoManager.getProject(projectId);
    if (!project) return;
    const newName = prompt('Edit project name:', project.name);
    if (newName === null) return;
    const newDescription = prompt('Edit project description:', project.description || '');
    if (newName && newName.trim() !== '') {
      const updates = { name: newName.trim(), description: newDescription || '' };
      if (this.todoManager.updateProject(projectId, updates)) {
        console.log(`✅ Updated project: ${newName}`);
        this.renderProjects();
        this.renderTodos();
        alert(`Project "${newName}" updated successfully!`);
      } else {
        alert('Failed to update project');
      }
    } else {
      alert('Project name cannot be empty!');
    }
  }
  
  renderProjects() {
    const projects = this.todoManager.projects;
    const sidebar = document.getElementById('projects-sidebar');
    if (!sidebar) return;
    const projectsList = document.getElementById('projects-list');
    if (projectsList) {
      projectsList.innerHTML = '';
      projects.forEach(project => {
        const li = document.createElement('li');
        const isActive = project.id === this.currentProjectId;
        li.innerHTML = `
          <button class="project-btn${isActive ? ' active' : ''}" data-project-id="${project.id}">
            📁 ${project.name}
            <span class="project-count">(${project.getTodoCount().pending}/${project.getTodoCount().total})</span>
          </button>
        `;
        li.querySelector('.project-btn').addEventListener('click', () => {
          this.selectProject(project.id);
        });
        projectsList.appendChild(li);
      });
      console.log(`✅ Rendered ${projects.length} projects`);
    }
  }
  
  renderTodos(todos = null) {
    const project = this.todoManager.getCurrentProject();
    const container = document.getElementById('todos-container');
    if (!project || !container) return;
    const header = document.getElementById('current-project');
    if (header) {
      header.innerHTML = `
        <div class="project-header">
          <h2>${project.name}</h2>
          ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
          <button class="edit-project-btn" title="Edit project">
            <i class="fas fa-edit"></i> Edit
          </button>
        </div>
      `;
      const editBtn = header.querySelector('.edit-project-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => this.handleEditProject(project.id));
      }
    }
    container.innerHTML = '';
    const todosToRender = todos || project.todos;
    if (todosToRender.length === 0) {
      container.innerHTML = '<p class="empty-message">No todos yet. Add one!</p>';
      console.log('📭 No todos to display');
      return;
    }
    todosToRender.forEach(todo => {
      const todoElement = this.createTodoElement(todo);
      container.appendChild(todoElement);
    });
    console.log(`✅ Rendered ${todosToRender.length} todos`);
  }
  
  createTodoElement(todo) {
    const div = document.createElement('div');
    div.className = `todo-item ${todo.getPriorityClass()}`;
    div.setAttribute('data-todo-id', todo.id);
    div.setAttribute("draggable", "true");
    
    div.innerHTML = `
      <div class="todo-header">
        <input type="checkbox" class="complete-checkbox" ${todo.completed ? 'checked' : ''}>
        <h3 class="todo-title">${todo.title}</h3>
        <div class="todo-actions">
          <button class="edit-todo-btn" title="Edit todo">✏️</button>
          <button class="delete-btn" title="Delete todo">🗑️</button>
        </div>
      </div>
      <div class="todo-details">
        <span class="due-date" title="${todo.getFullDate() || 'No due date'}">📅 ${todo.getFormattedDate()}</span>
        <span class="priority-badge">${todo.priority}</span>
      </div>
      ${todo.description ? `<p class="todo-description">${todo.description}</p>` : ''}
    `;
    
    const checkbox = div.querySelector('.complete-checkbox');
    checkbox.addEventListener('change', () => {
      this.toggleTodoComplete(todo.id);
    });
    
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      this.deleteTodo(todo.id);
    });
    
    const editBtn = div.querySelector('.edit-todo-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.showEditTodoModal(todo);
      });
    }
    
    return div;
  }
  
  selectProject(projectId) {
    this.todoManager.setCurrentProject(projectId);
    this.currentProjectId = projectId;
    this.renderProjects();
    this.renderTodos();
    console.log(`✅ Selected project: ${this.todoManager.getCurrentProject()?.name}`);
  }
  
  toggleTodoComplete(todoId) {
    this.todoManager.toggleTodoComplete(todoId);
    this.renderTodos();
    console.log('✅ Toggled todo completion');
  }
  
  deleteTodo(todoId) {
    if (confirm('Delete this todo?')) {
      this.todoManager.deleteTodo(todoId);
      this.renderTodos();
      console.log('✅ Deleted todo');
    }
  }
}
