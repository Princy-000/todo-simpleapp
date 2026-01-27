import { Storage } from './Storage.js';
import { Project } from './Project.js';
import Todo from './Todo.js';

export class TodoManager {
  constructor() {
    this.projects = [];
    this.currentProjectId = null;
    this.loadFromStorage();
    
    // Ensure at least one project exists
    if (this.projects.length === 0) {
      this.createProject('Inbox', 'Default project for todos');
    }
    
    // Set current project to first one if not set
    if (!this.currentProjectId && this.projects.length > 0) {
      this.currentProjectId = this.projects[0].id;
    }
  }

  // ===== PROJECT MANAGEMENT =====
  
  // Create a new project
  createProject(name, description = '') {
    const project = new Project(name, description);
    this.projects.push(project);
    
    // If this is the first project, set it as current
    if (this.projects.length === 1) {
      this.currentProjectId = project.id;
    }
    
    this.saveToStorage();
    return project;
  }

  // Get project by ID
  getProject(projectId) {
    return this.projects.find(project => project.id === projectId);
  }

  // Get current project
  getCurrentProject() {
    return this.getProject(this.currentProjectId);
  }
  // Get all projects
  getProjects() {
    return this.projects;
  }


  // Set current project
  setCurrentProject(projectId) {
    if (this.getProject(projectId)) {
      this.currentProjectId = projectId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Update project
  updateProject(projectId, updates) {
    const project = this.getProject(projectId);
    if (project) {
      Object.assign(project, updates);
      project.updatedAt = new Date();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Delete project
  deleteProject(projectId) {
    const index = this.projects.findIndex(p => p.id === projectId);
    if (index > -1) {
      // Don't delete if it's the last project
      if (this.projects.length === 1) {
        return false;
      }
      
      this.projects.splice(index, 1);
      
      // If we deleted the current project, switch to another
      if (projectId === this.currentProjectId) {
        this.currentProjectId = this.projects[0]?.id || null;
      }
      
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // ===== TODO MANAGEMENT =====
  
  // Add todo to current project
  addTodoToCurrent(todoData) {
    const project = this.getCurrentProject();
    if (!project) return null;
    
    const todo = new Todo(
      todoData.title,
      todoData.description,
      todoData.dueDate,
      todoData.priority || 'medium'
    );
    
    project.addTodo(todo);
    this.saveToStorage();
    return todo;
  }

  // Add todo to specific project
  addTodoToProject(projectId, todoData) {
    const project = this.getProject(projectId);
    if (!project) return null;
    
    const todo = new Todo(
      todoData.title,
      todoData.description,
      todoData.dueDate,
      todoData.priority || 'medium'
    );
    
    project.addTodo(todo);
    this.saveToStorage();
    return todo;
  }

  // Get todo by ID from any project
  getTodo(todoId) {
    for (const project of this.projects) {
      const todo = project.getTodo(todoId);
      if (todo) return { todo, project };
    }
    return null;
  }

  // Update todo
  updateTodo(todoId, updates) {
    const result = this.getTodo(todoId);
    if (result) {
      Object.assign(result.todo, updates);
      result.todo.updatedAt = new Date();
      result.project.updatedAt = new Date();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Delete todo
  deleteTodo(todoId) {
    for (const project of this.projects) {
      if (project.removeTodo(todoId)) {
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  // Toggle todo completion
  toggleTodoComplete(todoId) {
    const result = this.getTodo(todoId);
    if (result) {
      result.todo.toggleCompletion();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // ===== STORAGE =====
  
  // Load from localStorage
  loadFromStorage() {
    const data = Storage.loadState();
    if (data) {
      this.projects = data.projects || [];
      this.currentProjectId = data.currentProjectId || null;
      
      // Recreate class instances from plain objects
      this.projects = this.projects.map(projData => {
        const project = new Project(projData.name, projData.description);
        Object.assign(project, projData);
        
        project.todos = projData.todos.map(todoData => {
          // Prepare dueDate for constructor
          let dueDateForConstructor = null;
          
          if (todoData.dueDate) {
            // If it's a Date object (from Storage.js reviver)
            if (todoData.dueDate instanceof Date) {
              dueDateForConstructor = todoData.dueDate.toISOString().split("T")[0];
            }
            // If it's a string
            else if (typeof todoData.dueDate === "string") {
              // Check if it's already YYYY-MM-DD
              if (/^\d{4}-\d{2}-\d{2}$/.test(todoData.dueDate)) {
                dueDateForConstructor = todoData.dueDate;
              } else {
                // Try to convert
                const dateObj = new Date(todoData.dueDate);
                if (!isNaN(dateObj.getTime())) {
                  dueDateForConstructor = dateObj.toISOString().split("T")[0];
                }
              }
            }
          }
          
          // Create todo with properly formatted date string
          const todo = new Todo(
            todoData.title,
            todoData.description,
            dueDateForConstructor,
            todoData.priority
          );
          
          // Copy other properties BUT DO NOT OVERWRITE dueDate
          todo.completed = todoData.completed || false;
          todo.notes = todoData.notes || "";
          todo.checklist = todoData.checklist || [];
          if (todoData.id) todo.id = todoData.id;
          
          // Handle dates that should be Date objects
          if (todoData.createdAt) {
            todo.createdAt = todoData.createdAt instanceof Date ? 
              todoData.createdAt : new Date(todoData.createdAt);
          }
          if (todoData.updatedAt) {
            todo.updatedAt = todoData.updatedAt instanceof Date ? 
              todoData.updatedAt : new Date(todoData.updatedAt);
          }
          
          return todo;
        });
        
        return project;
      });
    }
  }

  // Save to localStorage
  saveToStorage() {
    const state = {
      projects: this.projects,
      currentProjectId: this.currentProjectId,
      savedAt: new Date()
    };
    Storage.saveState(state);
  }

  // ===== UTILITIES =====
  
  // Get all todos across all projects
  getAllTodos() {
    return this.projects.flatMap(project => 
      project.todos.map(todo => ({
        ...todo,
        projectName: project.name,
        projectId: project.id
      }))
    );
  }

  // Get overdue todos across all projects
  getAllOverdueTodos() {
    return this.getAllTodos().filter(todo => todo.isOverdue());
  }

  // Get todos due today across all projects
  getAllTodosDueToday() {
    const today = new Date().toDateString();
    return this.getAllTodos().filter(todo => 
      todo.dueDate && todo.dueDate.toDateString() === today
    );
  }

  // Search todos
  searchTodos(query) {
    const searchLower = query.toLowerCase();
    return this.getAllTodos().filter(todo =>
      todo.title.toLowerCase().includes(searchLower) ||
      todo.description.toLowerCase().includes(searchLower) ||
      todo.notes.toLowerCase().includes(searchLower)
    );
  }

  // Get statistics
  getStats() {
    const allTodos = this.getAllTodos();
    const completed = allTodos.filter(t => t.completed).length;
    const pending = allTodos.filter(t => !t.completed).length;
    const overdue = allTodos.filter(t => t.isOverdue()).length;
    
    return {
      totalProjects: this.projects.length,
      totalTodos: allTodos.length,
      completed,
      pending,
      overdue,
      completionRate: allTodos.length > 0 ? (completed / allTodos.length * 100).toFixed(1) : 0
    };
  }

  // Export data for backup
  exportData() {
    return {
      projects: this.projects,
      currentProjectId: this.currentProjectId,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import data from backup
  importData(data) {
    if (data.version === '1.0' && Array.isArray(data.projects)) {
      this.projects = data.projects;
      this.currentProjectId = data.currentProjectId || null;
      this.saveToStorage();
      return true;
    }
    return false;
  }
}
