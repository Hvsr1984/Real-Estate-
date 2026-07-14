/* js/dashboard.js - Entry point for the CMS Admin Panel */

import { AppController } from './controllers/AppController.js';
import { DashboardController } from './controllers/DashboardController.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();

    const dashboard = new DashboardController();
    dashboard.init();
});
