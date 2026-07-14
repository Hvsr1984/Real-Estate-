/* js/property.js - Showroom Detailed View Bootloader */

import { AppController } from './controllers/AppController.js';
import { DetailsController } from './controllers/DetailsController.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();

    const details = new DetailsController();
    details.init();
});
