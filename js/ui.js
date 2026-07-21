/**
 * UIManager - Main User Interface Orchestrator
 * Hulu / Max Inspired UI with Brand Hubs, TMDb IDs, IMDb IDs, Episode Guides, and Custom Video Player.
 */

import { MediaAPI, BRAND_HUBS } from './api.js';
import { StorageManager } from './storage.js';
import { CustomPlayer } from './player.js';
import { SearchEngine } from './search.js';

export class UIManager {
  constructor() {
    this.currentView = 'home';
    this.player = null;
    this.searchEngine = new SearchEngine();
    this.heroItems = [];
    this.currentHeroIndex = 0;
    this.heroInterval = null;
    this.activeHub = 'all';

    this.initPlayer();
    this.bindGlobalEvents();
  }

  /**
   * Initialize custom video player instance
   */
  initPlayer() {
    this.player = new CustomPlayer({
      container: document.body,
      onClose: () => {
        this.renderContinueWatching();
      }
    });
  }

  /**
   * Bind global navigation & search events
   */
  bindGlobalEvents() {
    // Navigation targets
    document.querySelectorAll('[data-view-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = el.dataset.viewTarget;
        this.switchView(targetView);
      });
    });

    // Global & Main Search input handler
    const globalSearchInput = document.getElementById('global-search-input');
    const mainSearchInput = document.getElementById('main-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchFilterType = document.getElementById('filter-type-select');
    const searchFilterGenre = document.getElementById('filter-genre-select');
    const searchFilterSort = document.getElementById('filter-sort-select');

    const handleSearchInput = (val) => {
      if (globalSearchInput && globalSearchInput.value !== val) globalSearchInput.value = val;
      if (mainSearchInput && mainSearchInput.value !== val) mainSearchInput.value = val;

      if (clearSearchBtn) {
        if (val.trim().length > 0) clearSearchBtn.classList.remove('hidden');
        else clearSearchBtn.classList.add('hidden');
      }

      this.searchEngine.setQuery(val);
      if (val.trim().length > 0 && this.currentView !== 'search') {
        this.switchView('search');
      }
      this.triggerSearch();
    };

    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    }

    if (mainSearchInput) {
      mainSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => handleSearchInput(''));
    }

    // Quick Search Chip Pill buttons
    document.querySelectorAll('.search-chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query || '';
        const type = chip.dataset.type || 'all';

        // Update active chip UI
        document.querySelectorAll('.search-chip-btn').forEach(c => {
          c.classList.remove('bg-purple-600/90', 'border-purple-400/40');
          c.classList.add('bg-[#181236]', 'border-purple-500/20');
        });
        chip.classList.add('bg-purple-600/90', 'border-purple-400/40');

        if (searchFilterType) {
          searchFilterType.value = type;
          this.searchEngine.setFilter('type', type);
        }

        handleSearchInput(query);
      });
    });

    // Global Hotkey (Cmd+K / Ctrl+K)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.switchView('search');
        if (mainSearchInput) mainSearchInput.focus();
        else if (globalSearchInput) globalSearchInput.focus();
      }
    });

    if (searchFilterType) {
      searchFilterType.addEventListener('change', (e) => {
        this.searchEngine.setFilter('type', e.target.value);
        this.triggerSearch();
      });
    }

    if (searchFilterGenre) {
      searchFilterGenre.addEventListener('change', (e) => {
        this.searchEngine.setFilter('genre', e.target.value);
        this.triggerSearch();
      });
    }

    if (searchFilterSort) {
      searchFilterSort.addEventListener('change', (e) => {
        this.searchEngine.setFilter('sortBy', e.target.value);
        this.triggerSearch();
      });
    }

    // Modal Close buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal-backdrop') || e.target.closest('.modal-close-btn')) {
        this.closeAllModals();
      }
    });

    // Settings Modal Form Save
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiKey = document.getElementById('setting-api-key').value;
        const autoplay = document.getElementById('setting-autoplay').checked;
        const quality = document.getElementById('setting-quality').value;

        StorageManager.saveSettings({
          tmdbApiKey: apiKey,
          autoplayNext: autoplay,
          defaultQuality: quality
        });

        this.showToast('Settings saved successfully!');
        this.closeAllModals();
        this.refreshHomeData();
      });
    }

    // Clear History Button
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your watch history?')) {
          localStorage.removeItem('cinestar_watch_history');
          this.showToast('Watch history cleared.');
          this.renderContinueWatching();
        }
      });
    }
  }

  /**
   * Switch Active View (Home, Movies, TV, Search, Watchlist, Favorites, Settings)
   */
  switchView(viewName) {
    this.currentView = viewName;

    // Update active state in Navigation links
    document.querySelectorAll('[data-view-target]').forEach(nav => {
      const isActive = nav.dataset.viewTarget === viewName;
      nav.classList.toggle('bg-purple-600/80', isActive);
      nav.classList.toggle('text-white', isActive);
      nav.classList.toggle('text-slate-300', !isActive);
    });

    // Hide all view containers, show targeted view
    document.querySelectorAll('.app-view-container').forEach(container => {
      container.classList.add('hidden');
    });

    const targetContainer = document.getElementById(`view-${viewName}`);
    if (targetContainer) {
      targetContainer.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render View Content
    if (viewName === 'home') this.renderHomeView();
    if (viewName === 'movies') this.renderMoviesView();
    if (viewName === 'tv') this.renderTVView();
    if (viewName === 'search') this.triggerSearch();
    if (viewName === 'watchlist') this.renderWatchlistView();
    if (viewName === 'favorites') this.renderFavoritesView();
    if (viewName === 'settings') this.openSettingsModal();
  }

  /**
   * Render Brand Hubs Channel Selector
   */
  renderBrandHubs() {
    const container = document.getElementById('brand-hubs-container');
    if (!container) return;

    container.innerHTML = BRAND_HUBS.map(hub => {
      const isActive = this.activeHub === hub.id;
      return `
        <button class="brand-hub-card relative p-3 rounded-2xl bg-gradient-to-br ${hub.bgGradient} border ${isActive ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-purple-500/20'} flex flex-col items-center justify-center text-center overflow-hidden group shadow-xl" data-hub-id="${hub.id}">
          <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span class="text-xl mb-1">${hub.icon}</span>
          <span class="text-xs font-black uppercase text-white tracking-wider">${hub.name}</span>
          ${hub.badge ? `<span class="mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-black/40 text-emerald-300 border border-emerald-400/30">${hub.badge}</span>` : ''}
        </button>
      `;
    }).join('');

    container.querySelectorAll('.brand-hub-card').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeHub = btn.dataset.hubId;
        this.renderBrandHubs();
        this.renderHomeView();
      });
    });
  }

  /**
   * Render Home View (Hero Spotlight + Brand Hubs + All Media Rows)
   */
  async renderHomeView() {
    this.renderBrandHubs();
    this.renderContinueWatching();

    const trending = await MediaAPI.getTrending('all', this.activeHub);
    this.heroItems = trending.slice(0, 5);
    this.setupHeroCarousel();

    // Render Rows
    const hubName = BRAND_HUBS.find(h => h.id === this.activeHub)?.name || 'Max & Hulu';
    const rowTitle = this.activeHub === 'all' ? 'Trending on Max & Hulu' : `Featured on ${hubName}`;
    const rowTitleEl = document.getElementById('trending-row-title');
    if (rowTitleEl) rowTitleEl.textContent = rowTitle;

    this.renderRow('trending-row-container', trending);
    
    const popularMovies = await MediaAPI.getPopularMovies();
    this.renderRow('popular-movies-container', popularMovies);

    const popularTV = await MediaAPI.getPopularTV();
    this.renderRow('popular-tv-container', popularTV);

    const topRated = await MediaAPI.getTopRated('movie');
    this.renderRow('top-rated-container', topRated);

    const upcoming = await MediaAPI.getUpcoming();
    this.renderRow('upcoming-container', upcoming);
  }

  /**
   * Render Movies Only View
   */
  async renderMoviesView() {
    const popular = await MediaAPI.getPopularMovies();
    const topRated = await MediaAPI.getTopRated('movie');
    const upcoming = await MediaAPI.getUpcoming();

    this.renderGrid('movies-grid-container', [...popular, ...topRated, ...upcoming]);
  }

  /**
   * Render TV Series Only View
   */
  async renderTVView() {
    const popular = await MediaAPI.getPopularTV();
    const topRated = await MediaAPI.getTopRated('tv');

    this.renderGrid('tv-grid-container', [...popular, ...topRated]);
  }

  /**
   * Render Watchlist View
   */
  renderWatchlistView() {
    const list = StorageManager.getWatchlist();
    const container = document.getElementById('watchlist-grid-container');
    const emptyState = document.getElementById('watchlist-empty-state');

    if (list.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (container) container.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    this.renderGrid('watchlist-grid-container', list);
  }

  /**
   * Render Favorites View
   */
  renderFavoritesView() {
    const list = StorageManager.getFavorites();
    const container = document.getElementById('favorites-grid-container');
    const emptyState = document.getElementById('favorites-empty-state');

    if (list.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (container) container.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    this.renderGrid('favorites-grid-container', list);
  }

  /**
   * Render Continue Watching Row
   */
  renderContinueWatching() {
    const list = StorageManager.getContinueWatching();
    const rowSection = document.getElementById('continue-watching-section');
    const container = document.getElementById('continue-watching-container');

    if (!rowSection || !container) return;

    if (list.length === 0) {
      rowSection.classList.add('hidden');
      return;
    }

    rowSection.classList.remove('hidden');
    container.innerHTML = list.map(item => `
      <div class="media-card flex-none w-72 group relative bg-[#120e24] rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:border-emerald-400">
        <div class="relative aspect-video w-full overflow-hidden bg-slate-900">
          <img src="${item.backdrop || item.poster || MediaAPI.getImageUrl(null)}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-[#080612] via-[#080612]/30 to-transparent"></div>
          
          <!-- Play Overlay Button -->
          <button class="resume-play-btn absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" data-key="${item.key}" data-id="${item.id}" data-type="${item.type}" data-time="${item.currentTime}" data-season="${item.season || ''}" data-episode="${item.episode || ''}">
            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <svg class="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </button>

          <!-- Remove Button -->
          <button class="remove-history-btn absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-slate-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100" data-key="${item.key}" title="Remove">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-3.5">
          <h4 class="text-sm font-black text-white truncate mb-1">${item.title}</h4>
          <p class="text-xs text-emerald-400 font-bold mb-2">${item.season ? `S${item.season}:E${item.episode}` : 'Movie'} • ${item.currentTime ? CustomPlayer.prototype.formatTime(item.currentTime) : '0:00'} left</p>
          
          <!-- Progress Bar -->
          <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full" style="width: ${item.progress}%"></div>
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.resume-play-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        const time = parseFloat(btn.dataset.time || 0);
        const details = await MediaAPI.getDetails(id, type);
        
        if (btn.dataset.season && btn.dataset.episode) {
          details.season = btn.dataset.season;
          details.episode = btn.dataset.episode;
        }

        this.player.loadMedia(details, time);
      });
    });

    container.querySelectorAll('.remove-history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        StorageManager.removeFromWatchHistory(btn.dataset.key);
        this.renderContinueWatching();
      });
    });
  }

  /**
   * Setup Hero Carousel
   */
  setupHeroCarousel() {
    if (!this.heroItems || this.heroItems.length === 0) return;

    this.updateHeroBanner(this.heroItems[0]);

    clearInterval(this.heroInterval);
    this.heroInterval = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroItems.length;
      this.updateHeroBanner(this.heroItems[this.currentHeroIndex]);
    }, 8000);
  }

  /**
   * Update Hero Spotlight Content
   */
  async updateHeroBanner(item) {
    const backdropEl = document.getElementById('hero-backdrop-img');
    const titleEl = document.getElementById('hero-title');
    const taglineEl = document.getElementById('hero-tagline');
    const descEl = document.getElementById('hero-overview');
    const genresEl = document.getElementById('hero-genres');
    const matchEl = document.getElementById('hero-match-score');
    const badgeEl = document.getElementById('hero-badge');
    const yearEl = document.getElementById('hero-year');
    const playBtn = document.getElementById('hero-play-btn');
    const infoBtn = document.getElementById('hero-info-btn');
    const watchlistBtn = document.getElementById('hero-watchlist-btn');

    if (!titleEl) return;

    const fullDetails = await MediaAPI.getDetails(item.id, item.type);

    if (backdropEl) backdropEl.src = fullDetails.backdrop_path || fullDetails.poster_path;
    titleEl.textContent = fullDetails.title || fullDetails.name;
    if (taglineEl) taglineEl.textContent = fullDetails.tagline ? `"${fullDetails.tagline}"` : '';
    descEl.textContent = fullDetails.overview || 'Experience this masterwork in pristine 4K HDR resolution.';
    genresEl.textContent = (fullDetails.genres || []).map(g => g.name || g).join(' • ');
    matchEl.textContent = `${fullDetails.match_score || 98}% Match`;
    if (badgeEl) badgeEl.textContent = fullDetails.badge || 'HBO ORIGINAL';
    yearEl.textContent = fullDetails.year || '2024';

    if (playBtn) {
      playBtn.onclick = () => this.player.loadMedia(fullDetails);
    }

    if (infoBtn) {
      infoBtn.onclick = () => this.openMediaModal(fullDetails.id, fullDetails.type);
    }

    if (watchlistBtn) {
      const inWatchlist = StorageManager.isInWatchlist(fullDetails.id, fullDetails.type);
      watchlistBtn.innerHTML = inWatchlist ? 
        `<svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>` :
        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`;

      watchlistBtn.onclick = () => {
        const res = StorageManager.toggleWatchlist(fullDetails);
        this.showToast(res.inWatchlist ? 'Added to My Stuff' : 'Removed from My Stuff');
        this.updateHeroBanner(fullDetails);
      };
    }
  }

  /**
   * Render Media Row
   */
  renderRow(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = items.map(item => this.createCardHTML(item)).join('');
    this.attachCardEventListeners(container);
  }

  /**
   * Render Media Grid
   */
  renderGrid(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = items.map(item => this.createCardHTML(item)).join('');
    this.attachCardEventListeners(container);
  }

  /**
   * Create Hulu/Max Style Poster Card
   */
  createCardHTML(item) {
    const isFav = StorageManager.isFavorite(item.id, item.type);

    return `
      <div class="media-card flex-none w-44 md:w-52 group/card relative bg-[#120e24] rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-purple-500/60 cursor-pointer" data-id="${item.id}" data-type="${item.type || 'movie'}">
        <div class="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
          <img src="${item.poster_path || MediaAPI.getImageUrl(item.poster)}" alt="${item.title || item.name}" class="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-[#080612] via-transparent to-transparent opacity-80 group-hover/card:opacity-100 transition-opacity"></div>

          <!-- Top Badge & Favorite Button -->
          <div class="absolute inset-x-2 top-2 flex items-center justify-between z-10">
            <span class="px-2 py-0.5 rounded bg-purple-600/90 text-[9px] font-black uppercase text-white shadow-md">
              ${(item.type || 'movie') === 'tv' ? 'SERIES' : 'MOVIE'}
            </span>

            <button class="fav-card-btn p-1.5 rounded-full bg-black/60 hover:bg-emerald-500 text-slate-300 hover:text-white transition-colors" data-id="${item.id}" data-type="${item.type}">
              <svg class="w-4 h-4 ${isFav ? 'text-emerald-400 fill-emerald-400' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
          </div>

          <!-- Play Button Overlay -->
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-black/40">
            <div class="play-card-btn w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <svg class="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>

          <!-- Bottom Badges -->
          <div class="absolute inset-x-2 bottom-2 flex items-center justify-between text-[10px] font-bold text-slate-200">
            <span class="text-emerald-400">${item.match_score || 98}% Match</span>
            <span class="text-amber-400">★ ${item.vote_average || '8.4'}</span>
          </div>
        </div>

        <div class="p-3">
          <h4 class="text-xs md:text-sm font-extrabold text-white truncate mb-0.5">${item.title || item.name}</h4>
          <p class="text-[10px] text-slate-400 truncate">${(item.genres || []).map(g => g.name || g).slice(0, 2).join(', ') || (item.type === 'tv' ? 'TV Series' : 'Feature Movie')}</p>
        </div>
      </div>
    `;
  }

  /**
   * Attach Card Click Listeners
   */
  attachCardEventListeners(container) {
    container.querySelectorAll('.media-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-card-btn')) return;

        const id = card.dataset.id;
        const type = card.dataset.type;

        if (e.target.closest('.play-card-btn')) {
          MediaAPI.getDetails(id, type).then(details => this.player.loadMedia(details));
        } else {
          this.openMediaModal(id, type);
        }
      });
    });

    container.querySelectorAll('.fav-card-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        const details = await MediaAPI.getDetails(id, type);
        const res = StorageManager.toggleFavorite(details);
        this.showToast(res.isFavorite ? 'Saved to Favorites' : 'Removed from Favorites');
        this.refreshHomeData();
      });
    });
  }

  /**
   * Search Execution
   */
  async triggerSearch() {
    const resultsContainer = document.getElementById('search-results-grid');
    const searchCountEl = document.getElementById('search-results-count');

    if (!resultsContainer) return;

    this.searchEngine.debounceSearch((results) => {
      if (searchCountEl) searchCountEl.textContent = `${results.length} titles found`;

      if (results.length === 0) {
        resultsContainer.innerHTML = `
          <div class="col-span-full text-center py-16 px-4 bg-[#120e24]/60 border border-purple-500/20 rounded-3xl backdrop-blur-xl">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-3xl">
              🔍
            </div>
            <h3 class="text-xl font-black text-white mb-2">No matching titles found</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              We couldn't find any media matching "${this.searchEngine.query}". Try searching by title, actor, director, genre, or IMDb ID (e.g., tt0944947).
            </p>
            <button id="reset-search-btn" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-full shadow-lg transition-transform hover:scale-105">
              Reset Search Filters
            </button>
          </div>
        `;

        const resetBtn = document.getElementById('reset-search-btn');
        if (resetBtn) {
          resetBtn.onclick = () => {
            this.searchEngine.resetFilters();
            const globalSearchInput = document.getElementById('global-search-input');
            const mainSearchInput = document.getElementById('main-search-input');
            if (globalSearchInput) globalSearchInput.value = '';
            if (mainSearchInput) mainSearchInput.value = '';
            this.triggerSearch();
          };
        }
      } else {
        this.renderGrid('search-results-grid', results);
      }
    }, 250);
  }

  /**
   * Open Comprehensive Media Details Modal
   */
  async openMediaModal(id, type = 'movie') {
    const modal = document.getElementById('media-details-modal');
    if (!modal) return;

    const details = await MediaAPI.getDetails(id, type);

    document.getElementById('modal-backdrop-img').src = details.backdrop_path || details.poster_path;
    document.getElementById('modal-poster-img').src = details.poster_path;
    document.getElementById('modal-media-title').textContent = details.title || details.name;
    document.getElementById('modal-media-tagline').textContent = details.tagline ? `"${details.tagline}"` : '';
    document.getElementById('modal-overview').textContent = details.overview;
    document.getElementById('modal-match-score').textContent = `${details.match_score || 98}% Match`;
    document.getElementById('modal-rating').textContent = details.vote_average ? `★ ${details.vote_average}` : '★ 8.5';
    document.getElementById('modal-year').textContent = details.year || '2024';
    document.getElementById('modal-runtime').textContent = `${details.runtime || 120} min`;
    document.getElementById('modal-genres').textContent = (details.genres || []).map(g => g.name || g).join(' • ');
    document.getElementById('modal-director').textContent = details.director || 'N/A';
    document.getElementById('modal-writers').textContent = (details.writers || []).join(', ') || 'N/A';
    document.getElementById('modal-tmdb-id').textContent = `TMDb ID: ${details.id}`;
    document.getElementById('modal-imdb-id').textContent = details.imdb_id ? `IMDb: ${details.imdb_id}` : `IMDb: Verified`;
    document.getElementById('modal-badge').textContent = details.badge || 'MAX ORIGINAL';

    const playBtn = document.getElementById('modal-play-btn');
    const watchlistBtn = document.getElementById('modal-watchlist-btn');
    const trailerBtn = document.getElementById('modal-trailer-btn');

    playBtn.onclick = () => {
      this.closeAllModals();
      this.player.loadMedia(details);
    };

    trailerBtn.onclick = () => {
      this.openTrailerModal(details.trailer_key || 'YoHD9XEInc0');
    };

    const inWatchlist = StorageManager.isInWatchlist(details.id, details.type);
    watchlistBtn.innerHTML = inWatchlist ? 
      `<svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> In My Stuff` :
      `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Add to My Stuff`;

    watchlistBtn.onclick = () => {
      const res = StorageManager.toggleWatchlist(details);
      this.showToast(res.inWatchlist ? 'Added to My Stuff' : 'Removed from My Stuff');
      this.openMediaModal(id, type);
    };

    // Cast list
    const castContainer = document.getElementById('modal-cast-container');
    if (castContainer) {
      castContainer.innerHTML = (details.cast || []).map(actor => `
        <div class="flex-none w-24 text-center">
          <img src="${actor.profile_path || 'https://via.placeholder.com/185x185/222/fff?text=Actor'}" class="w-20 h-20 rounded-full object-cover mx-auto mb-2 border border-purple-500/30 shadow-md">
          <p class="text-xs font-black text-white truncate">${actor.name}</p>
          <p class="text-[10px] text-slate-400 truncate">${actor.character}</p>
        </div>
      `).join('');
    }

    // TV Seasons & Episodes Browser
    const tvSeasonsSection = document.getElementById('modal-tv-seasons-section');
    if (type === 'tv') {
      tvSeasonsSection.classList.remove('hidden');
      this.renderTVSeasonSelector(details);
    } else {
      tvSeasonsSection.classList.add('hidden');
    }

    // Recommendations
    this.renderRow('modal-similar-container', details.similar || details.recommendations || []);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  /**
   * Render Season and Episode selector for TV Series
   */
  async renderTVSeasonSelector(tvDetails) {
    const seasonSelect = document.getElementById('modal-season-select');
    const episodeList = document.getElementById('modal-episodes-list');

    if (!seasonSelect || !episodeList) return;

    seasonSelect.innerHTML = Array.from({ length: tvDetails.seasons_count || 1 }).map((_, idx) => `
      <option value="${idx + 1}">Season ${idx + 1}</option>
    `).join('');

    const loadSeasonEpisodes = async (seasonNum) => {
      episodeList.innerHTML = '<div class="p-6 text-center text-slate-400 col-span-2">Loading episode guides...</div>';
      const seasonData = await MediaAPI.getTVSeasonDetails(tvDetails.id, seasonNum);

      episodeList.innerHTML = seasonData.episodes.map(ep => `
        <div class="episode-card flex flex-col sm:flex-row gap-3.5 p-3 rounded-2xl bg-[#140f2e] hover:bg-[#1f1845] transition-all border border-purple-500/20 cursor-pointer group" data-season="${seasonNum}" data-ep="${ep.episode_number}">
          <div class="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-900 flex-none border border-purple-500/20">
            <img src="${ep.still_path}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy">
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 text-white flex items-center justify-center shadow-xl">
                <svg class="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-300">${ep.runtime}m</span>
          </div>

          <div class="flex-1 flex flex-col justify-center">
            <div class="flex items-center justify-between mb-1">
              <h5 class="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">${ep.episode_number}. ${ep.title}</h5>
            </div>
            <p class="text-[11px] text-slate-400 line-clamp-2 leading-snug">${ep.overview}</p>
          </div>
        </div>
      `).join('');

      episodeList.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', () => {
          const epNum = card.dataset.ep;
          const matchEp = seasonData.episodes.find(e => Number(e.episode_number) === Number(epNum));
          
          const epMediaItem = {
            ...tvDetails,
            season: seasonNum,
            episode: epNum,
            episodeTitle: matchEp ? matchEp.title : `Episode ${epNum}`,
            stream_url: matchEp ? matchEp.stream_url : tvDetails.stream_url,
            skip_intro: matchEp?.skip_intro,
            skip_credits: matchEp?.skip_credits
          };

          this.closeAllModals();
          this.player.loadMedia(epMediaItem);
        });
      });
    };

    seasonSelect.onchange = (e) => loadSeasonEpisodes(e.target.value);
    loadSeasonEpisodes(1);
  }

  /**
   * Open Trailer Modal with YouTube Embed
   */
  openTrailerModal(trailerKey) {
    const modal = document.getElementById('trailer-modal');
    const iframe = document.getElementById('trailer-iframe');
    if (!modal || !iframe) return;

    iframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  /**
   * Open Settings Modal
   */
  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    const settings = StorageManager.getSettings();
    document.getElementById('setting-api-key').value = settings.tmdbApiKey || '';
    document.getElementById('setting-autoplay').checked = settings.autoplayNext !== false;
    document.getElementById('setting-quality').value = settings.defaultQuality || '1080p';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  /**
   * Close all active modals
   */
  closeAllModals() {
    document.querySelectorAll('.app-modal-overlay').forEach(modal => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });

    const trailerIframe = document.getElementById('trailer-iframe');
    if (trailerIframe) trailerIframe.src = '';
  }

  /**
   * Show Toast Notification Popup
   */
  showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'px-4 py-3 bg-[#120e24]/95 border border-purple-500/40 text-emerald-300 font-bold text-xs rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto';
    toast.innerHTML = `
      <svg class="w-5 h-5 text-emerald-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Refresh Home View Data
   */
  refreshHomeData() {
    if (this.currentView === 'home') this.renderHomeView();
  }
}
