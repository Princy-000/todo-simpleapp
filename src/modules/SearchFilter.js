// src/modules/SearchFilter.js
export class SearchFilter {
    constructor(todoManager, ui) {
        this.todoManager = todoManager;
        this.ui = ui;
        this.searchTerm = '';
        this.currentFilter = 'all'; // 'all', 'active', 'completed'
        this.searchInput = null;
        this.filterButtons = null;
        this.resultsCountElement = null;
        this.eventListenersAdded = false;
        this.lastRenderedFilter = null;
    }

    init() {
        this.createSearchUI();
        this.setupEventListeners();
        this.updateResultsCount();
        this.setFilter('all'); // Ensure "All" is active on init
    }

    createSearchUI() {
        console.log('🔄 SearchFilter: Creating search UI...');
        
        const todosContainer = document.getElementById('todos-container');
        if (!todosContainer) {
            console.warn('SearchFilter: Todos container not found, retrying...');
            setTimeout(() => this.createSearchUI(), 100);
            return;
        }

        console.log('✅ SearchFilter: Found todos container');

        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-header">
                <div class="search-input-group">
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="Search todos..."
                        aria-label="Search todos"
                    >
                    <button class="clear-search-btn" aria-label="Clear search" style="display: none;">
                        ×
                    </button>
                </div>
                
                <div class="filter-buttons">
                    <button class="filter-btn" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="active">Active</button>
                    <button class="filter-btn" data-filter="completed">Completed</button>
                </div>
            </div>
            
            <div class="search-results-info">
                <span class="results-count">0 todos</span>
            </div>
        `;

        // Insert before the todos container
        todosContainer.parentNode.insertBefore(searchContainer, todosContainer);
        
        // Store references
        this.searchInput = searchContainer.querySelector('.search-input');
        this.filterButtons = searchContainer.querySelectorAll('.filter-btn');
        this.resultsCountElement = searchContainer.querySelector('.results-count');
        this.clearSearchBtn = searchContainer.querySelector('.clear-search-btn');
        
        console.log('✅ SearchFilter: Search UI created successfully!');
    }

    setupEventListeners() {
        if (!this.searchInput || this.eventListenersAdded) return;
        
        // Search input events
        const handleSearchInput = (e) => {
            this.searchTerm = e.target.value.trim().toLowerCase();
            this.clearSearchBtn.style.display = this.searchTerm ? 'block' : 'none';
            this.applyFilters();
        };
        
        this.searchInput.addEventListener('input', handleSearchInput);

        // Clear search button
        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchTerm = '';
            this.clearSearchBtn.style.display = 'none';
            this.applyFilters();
            this.searchInput.focus();
        });

        // Filter button events
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });
        
        this.eventListenersAdded = true;
    }

    setFilter(filter) {
        console.log('🎯 setFilter called:', filter, 'current:', this.currentFilter);
        
        if (this.currentFilter === filter) return;
        
        this.currentFilter = filter;
        
        // CRITICAL FIX: Update active state of buttons
        if (this.filterButtons && this.filterButtons.length > 0) {
            this.filterButtons.forEach(btn => {
                if (btn.dataset.filter === filter) {
                    console.log('  Adding active to:', btn.dataset.filter);
                    btn.classList.add('active');
                } else {
                    console.log('  Removing active from:', btn.dataset.filter);
                    btn.classList.remove('active');
                }
            });
        } else {
            console.warn('❌ filterButtons not found!');
        }
        
        this.applyFilters();
    }

    applyFilters() {
        console.log('🔍 applyFilters called - search:', this.searchTerm || '(empty)', 'filter:', this.currentFilter);
        
        const currentProject = this.todoManager.getCurrentProject();
        let todos = currentProject ? currentProject.todos : [];
        
        // Apply search filter
        if (this.searchTerm) {
            todos = todos.filter(todo => {
                const titleMatch = todo.title.toLowerCase().includes(this.searchTerm);
                const descMatch = todo.description.toLowerCase().includes(this.searchTerm);
                return titleMatch || descMatch;
            });
        }
        
        // Apply status filter
        switch (this.currentFilter) {
            case 'active':
                todos = todos.filter(todo => !todo.completed);
                break;
            case 'completed':
                todos = todos.filter(todo => todo.completed);
                break;
            // 'all' shows all todos
        }
        
        console.log(`🔍 Filtered to ${todos.length} todos`);
        
        // ALWAYS update UI when filters change
        console.log('🔍 Updating UI with', todos.length, 'todos');
        this.ui.renderTodos(todos);
        
        this.updateResultsCount(todos.length);
        this.lastRenderedFilter = this.currentFilter;
    }

    updateResultsCount(count) {
        if (!this.resultsCountElement) return;
        
        const totalTodos = this.todoManager.getAllTodos().length;
        const filteredCount = count !== undefined ? count : 
            (this.todoManager.getCurrentProject()?.todos.length || 0);
        
        if (this.searchTerm || this.currentFilter !== 'all') {
            this.resultsCountElement.textContent = 
                `${filteredCount} of ${totalTodos} todos`;
        } else {
            this.resultsCountElement.textContent = 
                `${totalTodos} todos`;
        }
        
        console.log(`🔍 Results: ${this.resultsCountElement.textContent}`);
    }

    // Simple refresh
    refresh() {
        if (this.searchTerm || this.currentFilter !== 'all') {
            this.applyFilters();
        } else {
            this.updateResultsCount();
        }
    }
}
