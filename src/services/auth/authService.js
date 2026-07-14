/* js/services/auth/authService.js - Auth Service Domain */

import { databaseService } from '../databaseService.js';
import { UserRepository } from '../../database/repositories/UserRepository.js';
import { eventBus } from '../../core/eventBus.js';

export class AuthService {
    constructor() {
        const adapter = databaseService.getAdapter();
        this.userRepo = new UserRepository(adapter);
    }

    getCurrentUser() {
        const session = localStorage.getItem('user_session');
        return session ? JSON.parse(session) : null;
    }

    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    isAdmin() {
        const user = this.getCurrentUser();
        // Checked permissions (either role set, email curated, or fallback developer admin roles)
        return user && (
            user.role === 'admin' || 
            user.email?.includes('curator') || 
            user.email?.includes('admin')
        );
    }

    async login(email, password) {
        // Enterprise validation checks
        if (!email || !password) {
            throw new Error("Credentials email and password are required.");
        }

        // Mock authentication payload validation
        const normalized = email.toLowerCase();
        const role = (normalized.includes('curator') || normalized.includes('admin')) ? 'admin' : 'user';

        const userPayload = {
            id: `usr-${Date.now()}`,
            name: email.split('@')[0].toUpperCase(),
            email: normalized,
            role,
            loggedInAt: new Date().toISOString()
        };

        // Cache session
        localStorage.setItem('user_session', JSON.stringify(userPayload));

        // Save profile in user DB repository
        await this.userRepo.create(userPayload);

        eventBus.emit('auth.login', userPayload);
        return userPayload;
    }

    logout() {
        const user = this.getCurrentUser();
        localStorage.removeItem('user_session');
        eventBus.emit('auth.logout', user);
    }
}

export const authService = new AuthService();
