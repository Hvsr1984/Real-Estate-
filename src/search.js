/* js/search.js - Showroom Search Dashboard Bootloader */

import { AppController } from './controllers/AppController.js';
import { SearchController } from './controllers/SearchController.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();

    const search = new SearchController();
    search.init();
});
