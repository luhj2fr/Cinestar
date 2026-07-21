/**
 * StorageManager - Handles LocalStorage persistence for user data:
 * Watch history, Continue Watching, Favorites, Watchlist, User preferences, and Player settings.
 */

const STORAGE_KEYS = {
  WATCH_HISTORY: 'cinestar_watch_history',
  WATCHLIST: 'cinestar_watchlist',
  FAVORITES: 'cinestar_favorites',
  SETTINGS: 'cinestar_settings',
  CACHE_METADATA: 'cinestar_metadata_cache'
};

const DEFAULT_SETTINGS = {
  tmdbApiKey: '',
  autoplayNext: true,
  defaultQuality: '1080p',
  subtitlesEnabled: false,
  subtitleLanguage: 'en',
  skipIntroAuto: false,
  volume: 0.8,
  muted: false,
  theme: 'dark'
};

export class StorageManager {
  /**
   * Get all settings merged with defaults
   */
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('StorageManager: Failed to read settings', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Update and save user settings
   */
  static saveSettings(newSettings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('StorageManager: Failed to save settings', e);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Get Watch History list
   */
  static getWatchHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('StorageManager: Failed to read watch history', e);
      return [];
    }
  }

  /**
   * Update playback progress for a movie or TV episode
   * @param {Object} mediaItem - { id, type, title, poster, backdrop, season, episode, episodeTitle }
   * @param {number} currentTime - seconds watched
   * @param {number} duration - total video duration in seconds
   */
  static updateProgress(mediaItem, currentTime, duration) {
    if (!mediaItem || !mediaItem.id || !duration) return;

    try {
      const history = this.getWatchHistory();
      const progressPercent = Math.min(100, Math.round((currentTime / duration) * 100));
      const isCompleted = progressPercent >= 92;

      const key = `${mediaItem.type}_${mediaItem.id}${mediaItem.season ? `_s${mediaItem.season}_e${mediaItem.episode}` : ''}`;
      const updatedItem = {
        key,
        id: mediaItem.id,
        type: mediaItem.type || 'movie',
        title: mediaItem.title || mediaItem.name || 'Untitled',
        poster: mediaItem.poster || mediaItem.poster_path,
        backdrop: mediaItem.backdrop || mediaItem.backdrop_path,
        season: mediaItem.season || null,
        episode: mediaItem.episode || null,
        episodeTitle: mediaItem.episodeTitle || null,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        progress: progressPercent,
        completed: isCompleted,
        updatedAt: Date.now()
      };

      // Filter out existing record for this exact key
      const filtered = history.filter(item => item.key !== key);

      // Unless completed and very short remaining, keep in history
      if (!isCompleted || progressPercent < 98) {
        filtered.unshift(updatedItem);
      } else {
        // If completed, still keep record marked completed
        filtered.unshift(updatedItem);
      }

      // Limit watch history items to top 50
      const trimmed = filtered.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(trimmed));
      return updatedItem;
    } catch (e) {
      console.error('StorageManager: Failed to update watch history', e);
    }
  }

  /**
   * Get Continue Watching list (in-progress media with progress < 92%)
   */
  static getContinueWatching() {
    const history = this.getWatchHistory();
    return history.filter(item => !item.completed && item.progress > 1 && item.progress < 92);
  }

  /**
   * Remove item from watch history
   */
  static removeFromWatchHistory(key) {
    try {
      const history = this.getWatchHistory().filter(item => item.key !== key && item.id !== key);
      localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(history));
      return history;
    } catch (e) {
      console.error('StorageManager: Failed to remove watch history item', e);
    }
  }

  /**
   * Get Watchlist items
   */
  static getWatchlist() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('StorageManager: Failed to read watchlist', e);
      return [];
    }
  }

  /**
   * Toggle item in Watchlist
   */
  static toggleWatchlist(mediaItem) {
    try {
      const list = this.getWatchlist();
      const exists = list.some(i => String(i.id) === String(mediaItem.id) && i.type === mediaItem.type);
      
      let updated;
      if (exists) {
        updated = list.filter(i => !(String(i.id) === String(mediaItem.id) && i.type === mediaItem.type));
      } else {
        const newItem = {
          id: mediaItem.id,
          type: mediaItem.type || 'movie',
          title: mediaItem.title || mediaItem.name,
          poster: mediaItem.poster || mediaItem.poster_path,
          backdrop: mediaItem.backdrop || mediaItem.backdrop_path,
          rating: mediaItem.rating || mediaItem.vote_average,
          year: mediaItem.year || (mediaItem.release_date || mediaItem.first_air_date || '').substring(0, 4),
          overview: mediaItem.overview,
          addedAt: Date.now()
        };
        updated = [newItem, ...list];
      }

      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));
      return { inWatchlist: !exists, list: updated };
    } catch (e) {
      console.error('StorageManager: Failed to toggle watchlist', e);
      return { inWatchlist: false, list: [] };
    }
  }

  /**
   * Check if item is in Watchlist
   */
  static isInWatchlist(id, type) {
    const list = this.getWatchlist();
    return list.some(i => String(i.id) === String(id) && (!type || i.type === type));
  }

  /**
   * Get Favorites items
   */
  static getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('StorageManager: Failed to read favorites', e);
      return [];
    }
  }

  /**
   * Toggle item in Favorites
   */
  static toggleFavorite(mediaItem) {
    try {
      const list = this.getFavorites();
      const exists = list.some(i => String(i.id) === String(mediaItem.id) && i.type === mediaItem.type);

      let updated;
      if (exists) {
        updated = list.filter(i => !(String(i.id) === String(mediaItem.id) && i.type === mediaItem.type));
      } else {
        const newItem = {
          id: mediaItem.id,
          type: mediaItem.type || 'movie',
          title: mediaItem.title || mediaItem.name,
          poster: mediaItem.poster || mediaItem.poster_path,
          backdrop: mediaItem.backdrop || mediaItem.backdrop_path,
          rating: mediaItem.rating || mediaItem.vote_average,
          year: mediaItem.year || (mediaItem.release_date || mediaItem.first_air_date || '').substring(0, 4),
          overview: mediaItem.overview,
          addedAt: Date.now()
        };
        updated = [newItem, ...list];
      }

      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
      return { isFavorite: !exists, list: updated };
    } catch (e) {
      console.error('StorageManager: Failed to toggle favorites', e);
      return { isFavorite: false, list: [] };
    }
  }

  /**
   * Check if item is in Favorites
   */
  static isFavorite(id, type) {
    const list = this.getFavorites();
    return list.some(i => String(i.id) === String(id) && (!type || i.type === type));
  }

  /**
   * Cache fetched metadata locally
   */
  static cacheMetadata(id, type, data) {
    try {
      const cacheStr = localStorage.getItem(STORAGE_KEYS.CACHE_METADATA);
      const cache = cacheStr ? JSON.parse(cacheStr) : {};
      cache[`${type}_${id}`] = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(STORAGE_KEYS.CACHE_METADATA, JSON.stringify(cache));
    } catch (e) {
      // Storage quota might be reached, ignore or prune old cache
      console.warn('StorageManager: Metadata cache full or failed', e);
    }
  }

  /**
   * Get cached metadata
   */
  static getCachedMetadata(id, type) {
    try {
      const cacheStr = localStorage.getItem(STORAGE_KEYS.CACHE_METADATA);
      if (!cacheStr) return null;
      const cache = JSON.parse(cacheStr);
      const item = cache[`${type}_${id}`];
      // 24 hours cache validity
      if (item && (Date.now() - item.timestamp < 24 * 60 * 60 * 1000)) {
        return item.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear all application data
   */
  static clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
}
