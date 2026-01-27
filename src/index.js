import './styles/main.css';
import { TodoManager } from './modules/TodoManager.js';
import { UI } from './modules/UI.js';
import { DragDrop } from "./modules/DragDrop.js";
import { SearchFilter } from './modules/SearchFilter.js';

console.log('🚀 Todo SimpleApp - UI Integration Test');
console.log('=======================================');

// Initialize the todo manager
const todoManager = new TodoManager();

// Initialize UI with the manager
const ui = new UI(todoManager);
ui.init();

// Initialize drag & drop
const dragDrop = new DragDrop(todoManager, ui);
dragDrop.init();
window.dragDrop = dragDrop;

// Initialize search & filter - MUST be after UI.init() creates the container
const searchFilter = new SearchFilter(todoManager, ui);
// Wait a tiny bit for UI to render, then initialize search
setTimeout(() => {
  searchFilter.init();
  window.searchFilter = searchFilter;
  console.log('✅ Search & Filter initialized');
}, 100);

// Display initial state
console.log('📊 App State:');
console.log('- Projects:', todoManager.projects.length);
console.log('- Current Project:', todoManager.getCurrentProject()?.name);
console.log('- Todos in current project:', todoManager.getCurrentProject()?.getTodoCount().total);

// Make available globally for testing
window.todoManager = todoManager;
window.ui = ui;

console.log('\n🎯 UI Module Test Complete!');
console.log('- Type "ui" in console to explore UI instance');
console.log('- Type "todoManager" to explore business logic');
console.log('\n🔜 Next: We\'ll add actual UI rendering methods!');
