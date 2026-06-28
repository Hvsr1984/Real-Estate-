# LuxeHaven | Award-Winning Luxury Real Estate Platform

An elite, multi-page, production-ready luxury real estate platform designed with world-class agency aesthetics (Awwwards, Obys, Locomotive, Dribbble). It combines custom editorial layouts and typography with robust, client-side product functionality.

---

## ⚡ Core Features

1. **Editorial Dribbble Hero & CAD Blueprint**: A fullscreen video hero overlaid with oversized typography. Features an animated canvas drafting vector architectural CAD blueprints line-by-line in real time.
2. **Proximity-Aware GIS Map (Leaflet)**: Plots active coordinates using dark tilesets. Users can query nearby Metro Stations, Prep Schools, Healthcare, and Restaurants, calculating proximity distances dynamically.
3. **Immersive 360° Virtual Tour (Pannellum)**: Panoramic walkthrough capabilities inside showroom details with drag-and-pan controls.
4. **Mortgage EMI calculation & Graphing**: Renders live payments on loan inputs using Chart.js doughnut graphs dividing principal loan values against accumulated interest.
5. **CMS Admin Panel Dashboard**: Complete with dynamic analytics reports (totals portfolio value, ROIs, active leads) and an operational CRUD suite allowing additions, modifications, and deletions of listings synced with local storage.
6. **AI Concierge Chat Butler**: Smart search guide resolving user queries about locations, ROI properties, or amenities, suggesting visual recommendation cards directly inside bubbles.
7. **Multiple Property Comparison Studio**: Match details side-by-side (expected yields, areas, room metrics, builders, ROIs) in a sliding bottom panel leading to a detailed matrix modal.
8. **Synced Wishlist drawers**: Persistent save items stored inside browser local storage caches.
9. **Dynamic Security Locks**: Blocks admin panel dashboard files using a modal overlay shield if session credentials are not active.
10. **Awwwards Animations**: Lenis smooth inertial scrolling, magnetic target physics, custom mouse trails, and split heading slide-ins.

---

## 📂 Hierarchy Directories

```
luxehaven/
├── index.html                   # Redirector landing node
├── robots.txt                   # Search index boundaries
├── sitemap.xml                  # Index priority maps
├── data/
│   ├── properties.json          # Starter database list of residences
│   ├── blogs.json               # Starter database list of articles
│   └── agents.json              # Starter database list of agents
├── css/
│   ├── variables.css            # Dark/Light theme design variables
│   ├── reset.css                # Base typographic resets
│   ├── style.css                # Layout cards, buttons, widgets
│   ├── responsive.css           # Grid breakpoint scaling
│   └── animations.css           # Film grain grain overlays, cursors
├── js/
│   ├── app.js                   # Application coordinator & AI Butler
│   ├── cursor.js                # Custom magnetic target mouse trails
│   ├── search.js                # Advanced listings filter dashboard
│   ├── compare.js               # Side-by-side spec comparison table
│   ├── wishlist.js              # Shares & recently viewed caching queues
│   ├── property.js              # Panorama tours, EMI charts, floor plans
│   ├── map.js                   # Leaflet marker plotters
│   ├── auth.js                  # Credentials forms & phone SMS verify modals
│   ├── firebase.js              # Ready stubs configuration check rules
│   ├── lenis.js                 # Smooth scroll physics
│   └── gsap.js                  # Parallax entries & staggers
└── pages/
    ├── index.html               # Dribbble Editorial Home
    ├── properties.html          # Split-pane Search Map Showcase
    ├── property.html            # Luxury Residences Showroom Details
    ├── about.html               # Legacy timeline & Manifesto
    ├── agents.html              # Curator advisors directory
    ├── blog.html                # Insights Journal
    ├── contact.html             # Viewing schedule calendar desk
    ├── dashboard.html           # CMS analytical CRUD panel
    ├── 404.html                 # Error page
    ├── privacy.html             # Compliance framework
    └── terms.html               # Terms of use licensing agreement
```

---

## 🛠️ Getting Started & Local Run

1. Open `index.html` at the root directory inside any modern web browser.
2. Direct navigation links, dark/light themes, search inputs, and calculations are operational.
3. Access the **CMS Dashboard** in the header. To unlock analytics, click **Authenticate Identity** and log in via Google, phone OTP, or standard email inputs (`curator@luxehaven.com`).
4. To link remote server databases (like Cloud Firestore or Authentication), configure credentials inside `js/firebase.js`.
