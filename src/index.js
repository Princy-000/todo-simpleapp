import './styles/main.css';
import { TodoManager } from './modules/TodoManager.js';
import { UI } from './modules/UI.js';
import { DragDrop } from "./modules/DragDrop.js";
import { SearchFilter } from './modules/SearchFilter.js';

// Initialize the todo manager
const todoManager = new TodoManager();

// Initialize UI with the manager
const ui = new UI(todoManager);
ui.init();

// Initialize drag & drop
const dragDrop = new DragDrop(todoManager, ui);
dragDrop.init();

// Initialize search & filter
const searchFilter = new SearchFilter(todoManager, ui);
searchFilter.init();
ui.searchFilter = searchFilter;

// Optional: For debugging in development
if (process.env.NODE_ENV !== 'production') {
  window.todoManager = todoManager;
  window.ui = ui;
  window.dragDrop = dragDrop;
  window.searchFilter = searchFilter;
  console.log('✅ Todo SimpleApp initialized');
}
