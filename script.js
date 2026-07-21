/**
 * Main Application Script (Vanilla ES6+ Entry Point)
 * Initializes UIManager, binds scroll effects, keyboard shortcuts, and theme settings.
 */

import { UIManager } from './js/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI Manager
  const ui = new UIManager();
  ui.renderHomeView();

  // Navigation Bar Sticky Scroll Effect
  const navbar = document.getElementById('main-navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('bg-black/90', 'backdrop-blur-xl', 'border-b', 'border-zinc-800/80', 'shadow-2xl');
      navbar.classList.remove('bg-transparent');
    } else {
      navbar.classList.remove('bg-black/90', 'backdrop-blur-xl', 'border-b', 'border-zinc-800/80', 'shadow-2xl');
      navbar.classList.add('bg-transparent');
    }
  });

  // Cmd / Ctrl + K Search Shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('global-search-input');
      if (searchInput) {
        ui.switchView('search');
        searchInput.focus();
      }
    }
  });

  // Attach Horizontal Row Scroll Buttons
  document.querySelectorAll('.row-scroll-container').forEach(rowWrapper => {
    const scrollContent = rowWrapper.querySelector('.row-scroll-content');
    const leftBtn = rowWrapper.querySelector('.scroll-left-btn');
    const rightBtn = rowWrapper.querySelector('.scroll-right-btn');

    if (leftBtn && scrollContent) {
      leftBtn.addEventListener('click', () => {
        scrollContent.scrollBy({ left: -600, behavior: 'smooth' });
      });
    }

    if (rightBtn && scrollContent) {
      rightBtn.addEventListener('click', () => {
        scrollContent.scrollBy({ left: 600, behavior: 'smooth' });
      });
    }
  });
});
