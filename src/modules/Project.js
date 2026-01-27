export class Project {
  constructor(name, description = '') {
    this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    this.name = name;
    this.description = description;
    this.todos = []; // Array of Todo objects
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  
  // Add a todo to this project
  addTodo(todo) {
    this.todos.push(todo);
    this.updatedAt = new Date();
    return todo;
  }
  
  // Remove a todo by ID
  removeTodo(todoId) {
    const index = this.todos.findIndex(todo => todo.id === todoId);
    if (index > -1) {
      this.todos.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }
  
  // Get a todo by ID
  getTodo(todoId) {
    return this.todos.find(todo => todo.id === todoId);
  }
  
  // Update a todo's properties
  updateTodo(todoId, updates) {
    const todo = this.getTodo(todoId);
    if (todo) {
      Object.assign(todo, updates);
      todo.updatedAt = new Date();
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }
  
  // Get all completed todos
  getCompletedTodos() {
    return this.todos.filter(todo => todo.completed);
  }
  
  // Get all pending (incomplete) todos
  getPendingTodos() {
    return this.todos.filter(todo => !todo.completed);
  }
  
  // Get todos by priority
  getTodosByPriority(priority) {
    return this.todos.filter(todo => todo.priority === priority);
  }
  
  // Clear all completed todos
  clearCompleted() {
    const completedCount = this.getCompletedTodos().length;
    this.todos = this.getPendingTodos();
    if (completedCount > 0) {
      this.updatedAt = new Date();
    }
    return completedCount;
  }
  
  // Get todo statistics
  getTodoCount() {
    return {
      total: this.todos.length,
      completed: this.getCompletedTodos().length,
      pending: this.getPendingTodos().length
    };
  }
  
  // Get overdue todos
  getOverdueTodos() {
    return this.todos.filter(todo => todo.isOverdue && todo.isOverdue());
  }
  
  // Get todos due today
  getTodosDueToday() {
    return this.todos.filter(todo => {
      if (!todo.dueDate) return false;
      const today = new Date();
      return todo.dueDate.toDateString() === today.toDateString();
    });
  }
  
  // Sort todos by due date (earliest first)
  sortTodosByDueDate() {
    this.todos.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    });
  }
  
  // Sort todos by priority (high to low)
  sortTodosByPriority() {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.todos.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
