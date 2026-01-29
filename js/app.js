// ============================================
// MAIN APPLICATION - SPA Router & Initialization
// ============================================

class App {
    constructor() {
        this.currentModule = null;
        this.modules = {};
        // Don't call init() here - let it be called after modules register
    }

    init() {
        // Check authentication
        if (!auth.requireAuth()) return;

        // Initialize theme
        this.initTheme();

        // Setup navigation
        this.setupNavigation();

        // Setup header
        this.setupHeader();

        // Load default module
        this.loadModule('dashboard');
    }

    initTheme() {
        const config = storage.getConfiguracoes();
        const theme = config.tema || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.getAttribute('data-module');
                this.loadModule(module);
            });
        });
    }

    setupHeader() {
        const user = auth.getCurrentUser();
        const config = storage.getConfiguracoes();
        const displayName = config.displayName || user.nome;

        // Update user name in header
        const userNameElement = document.querySelector('.header-user-name');
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }

        // Update user avatar
        const userAvatarElement = document.querySelector('.header-user-avatar');
        if (userAvatarElement) {
            if (config.profileImage) {
                userAvatarElement.style.backgroundImage = `url(${config.profileImage})`;
                userAvatarElement.style.backgroundSize = 'cover';
                userAvatarElement.style.backgroundPosition = 'center';
                userAvatarElement.textContent = '';
            } else {
                userAvatarElement.textContent = displayName.charAt(0).toUpperCase();
            }
        }

        // Make user menu clickable to go to settings
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.addEventListener('click', () => {
                this.loadModule('configuracoes');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.logout();
            });
        }

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }


        // Mobile menu toggle
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        // Wait a bit to ensure DOM is fully loaded
        setTimeout(() => {
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const sidebar = document.querySelector('.sidebar');
            const sidebarOverlay = document.querySelector('.sidebar-overlay');

            console.log('Mobile menu setup:', { mobileMenuBtn, sidebar, sidebarOverlay });

            if (mobileMenuBtn && sidebar && sidebarOverlay) {
                // Toggle sidebar - support both click and touch
                const toggleSidebar = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Toggle sidebar clicked');
                    sidebar.classList.toggle('active');
                    sidebarOverlay.classList.toggle('active');
                };

                mobileMenuBtn.addEventListener('click', toggleSidebar);
                mobileMenuBtn.addEventListener('touchend', toggleSidebar);

                // Close sidebar when clicking overlay
                const closeOverlay = (e) => {
                    e.preventDefault();
                    console.log('Overlay clicked');
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                };

                sidebarOverlay.addEventListener('click', closeOverlay);
                sidebarOverlay.addEventListener('touchend', closeOverlay);

                // Close sidebar when clicking a menu item
                const sidebarItems = document.querySelectorAll('.nav-item');
                console.log('Found sidebar items:', sidebarItems.length);
                sidebarItems.forEach(item => {
                    const closeMenu = () => {
                        console.log('Menu item clicked');
                        sidebar.classList.remove('active');
                        sidebarOverlay.classList.remove('active');
                    };
                    item.addEventListener('click', closeMenu);
                    item.addEventListener('touchend', closeMenu);
                });
            } else {
                console.error('Mobile menu elements not found!', {
                    hasBtn: !!mobileMenuBtn,
                    hasSidebar: !!sidebar,
                    hasOverlay: !!sidebarOverlay
                });

                // Retry after another delay
                setTimeout(() => this.setupMobileMenu(), 500);
            }
        }, 100);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        storage.updateConfiguracoes({ tema: newTheme });

        // Update icon
        const icon = document.querySelector('.theme-toggle');
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    loadModule(moduleName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-module') === moduleName) {
                item.classList.add('active');
            }
        });

        // Update header title
        const titles = {
            dashboard: 'Dashboard',
            clientes: 'Clientes',
            agentes: 'Agentes',
            apartamentos: 'Apartamentos',
            reservas: 'Reservas',
            pagamentos: 'Pagamentos',
            configuracoes: 'Configurações'
        };

        const headerTitle = document.querySelector('.header-title');
        if (headerTitle) {
            headerTitle.textContent = titles[moduleName] || moduleName;
        }

        // Load module content
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            UI.showLoading(contentArea);

            // Simulate loading delay for smooth transition
            setTimeout(() => {
                if (this.modules[moduleName]) {
                    this.modules[moduleName].render(contentArea);
                } else {
                    contentArea.innerHTML = '<p>Módulo não encontrado</p>';
                }
            }, 200);
        }

        this.currentModule = moduleName;
    }

    registerModule(name, module) {
        this.modules[name] = module;
    }
}

// Create app instance immediately
console.log('🚀 Creating app instance...');
window.app = new App();
console.log('✅ App instance created');

// Register all queued modules
console.log(`📋 Processing module queue (${window.moduleQueue.length} modules)...`);
window.moduleQueue.forEach(({ name, module }) => {
    window.app.registerModule(name, module);
    console.log(`✅ Queued module "${name}" registered`);
});
console.log('✅ All queued modules registered. Total modules:', Object.keys(window.app.modules));

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded. Modules registered:', Object.keys(window.app.modules));
    // App already created, just initialize
    window.app.init();
});

