// ============================================
// AUTHENTICATION MANAGER
// ============================================

class AuthManager {
    constructor() {
        this.sessionKey = 'flatManagementSession';
        this.sharedDataKey = 'flatManagementSharedData'; // Shared data for all users
        this.users = [
            {
                id: '1',
                username: 'leticia.staff',
                password: 'staffcafetao123',
                nome: 'Leticia',
                role: 'admin'
            },
            {
                id: '2',
                username: 'victoria.staff',
                password: 'staffcafetao321',
                nome: 'Victoria',
                role: 'admin'
            }
        ];
    }

    // Login user
    login(username, password) {
        const user = this.users.find(
            u => u.username === username && u.password === password
        );

        if (user) {
            const session = {
                userId: user.id,
                username: user.username,
                nome: user.nome,
                role: user.role,
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));

            // Initialize shared data if it doesn't exist
            this.initializeSharedData();

            return { success: true, user: session };
        }

        return { success: false, message: 'Usuário ou senha incorretos' };
    }

    // Initialize shared data storage
    initializeSharedData() {
        if (!localStorage.getItem(this.sharedDataKey)) {
            const sharedData = {
                clientes: [],
                agentes: [],
                apartamentos: [],
                reservas: [],
                configuracoes: {}
            };
            localStorage.setItem(this.sharedDataKey, JSON.stringify(sharedData));
        }
    }

    // Logout user
    logout() {
        sessionStorage.removeItem(this.sessionKey);
        window.location.href = 'index.html';
    }

    // Get current session
    getSession() {
        const session = sessionStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.getSession() !== null;
    }

    // Require authentication (redirect if not logged in)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Get current user
    getCurrentUser() {
        return this.getSession();
    }

    // Verify password
    verifyPassword(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        return !!user;
    }

    // Update username
    updateUsername(userId, newUsername) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.username = newUsername;

            // Update session
            const session = this.getSession();
            if (session) {
                session.username = newUsername;
                sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
            }

            return true;
        }
        return false;
    }

    // Update password
    updatePassword(userId, newPassword) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.password = newPassword;
            return true;
        }
        return false;
    }
}

// Create global instance
window.auth = new AuthManager();
