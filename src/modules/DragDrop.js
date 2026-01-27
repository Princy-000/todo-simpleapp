export class DragDrop {
  constructor(todoManager, ui) {
    this.todoManager = todoManager;
    this.ui = ui;
    this.draggedTodo = null;
    this.dragOverElement = null;
  }

  init() {
    this.setupEventListeners();
    console.log('✅ Drag & Drop module initialized');
  }

  setupEventListeners() {
    // Use event delegation for dynamic todo items
    document.addEventListener('dragstart', this.handleDragStart.bind(this));
    document.addEventListener('dragover', this.handleDragOver.bind(this));
    document.addEventListener('drop', this.handleDrop.bind(this));
    document.addEventListener('dragend', this.handleDragEnd.bind(this));
    document.addEventListener('dragenter', this.handleDragEnter.bind(this));
    document.addEventListener('dragleave', this.handleDragLeave.bind(this));
  }

  handleDragStart(e) {
    // Only handle drag on todo items
    const todoElement = e.target.closest('.todo-item');
    if (!todoElement) return;
    
    const todoId = todoElement.dataset.todoId;
    if (!todoId) return;
    
    // Store dragged todo info
    this.draggedTodo = {
      element: todoElement,
      id: todoId,
      startIndex: this.getTodoIndex(todoId)
    };
    
    // Set drag data
    e.dataTransfer.setData('text/plain', todoId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Visual feedback
    todoElement.classList.add('dragging');
    
    // Add slight delay for opacity change
    setTimeout(() => {
      todoElement.style.opacity = '0.5';
    }, 0);
    
    console.log(`🚀 Started dragging todo: ${todoId}`);
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Only handle if dragging a todo
    if (!this.draggedTodo) return;
    
    const todoElement = e.target.closest('.todo-item');
    const container = document.querySelector('#todos-container');
    
    if (!container) return;
    
    // Find the element after which to insert
    const afterElement = this.getDragAfterElement(container, e.clientY);
    
    if (afterElement == null) {
      container.appendChild(this.draggedTodo.element);
    } else {
      container.insertBefore(this.draggedTodo.element, afterElement);
    }
  }

  handleDragEnter(e) {
    if (!this.draggedTodo) return;
    
    const todoElement = e.target.closest('.todo-item');
    if (todoElement && todoElement !== this.draggedTodo.element) {
      this.dragOverElement = todoElement;
      todoElement.classList.add('drag-over');
    }
  }

  handleDragLeave(e) {
    if (this.dragOverElement && !e.target.closest('.todo-item')) {
      this.dragOverElement.classList.remove('drag-over');
      this.dragOverElement = null;
    }
  }

  handleDrop(e) {
    e.preventDefault();
    
    if (!this.draggedTodo) return;
    
    const container = document.querySelector('#todos-container');
    if (!container) return;
    
    // Get new position index
    const todoElements = Array.from(container.children);
    const newIndex = todoElements.indexOf(this.draggedTodo.element);
    
    // Only reorder if position changed
    if (newIndex !== -1 && newIndex !== this.draggedTodo.startIndex) {
      this.reorderTodos(this.draggedTodo.id, newIndex);
      console.log(`✅ Moved todo from position ${this.draggedTodo.startIndex} to ${newIndex}`);
    }
    
    // Clean up visual states
    this.cleanupDragState();
  }

  handleDragEnd(e) {
    this.cleanupDragState();
    console.log('🎯 Drag ended');
  }

  cleanupDragState() {
    // Remove visual states from all elements
    document.querySelectorAll('.todo-item').forEach(el => {
      el.classList.remove('dragging', 'drag-over');
      el.style.opacity = '1';
    });
    
    this.draggedTodo = null;
    this.dragOverElement = null;
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  getTodoIndex(todoId) {
    const project = this.todoManager.getCurrentProject();
    if (!project || !project.todos) return -1;
    
    return project.todos.findIndex(todo => todo.id === todoId);
  }

  reorderTodos(todoId, newIndex) {
    const project = this.todoManager.getCurrentProject();
    if (!project) return;
    
    const todoIndex = project.todos.findIndex(todo => todo.id === todoId);
    if (todoIndex === -1) return;
    
    // Remove todo from old position
    const [todo] = project.todos.splice(todoIndex, 1);
    
    // Insert at new position
    project.todos.splice(newIndex, 0, todo);
    
    // Update position properties based on new order
    project.todos.forEach((todo, index) => {
      todo.position = index;
      todo.updatedAt = new Date();
    });
    
    // Save to storage and refresh UI
    this.todoManager.saveToStorage();
    this.ui.renderTodos();
    
    console.log(`💾 Saved new order for ${project.todos.length} todos`);
  }
}
