/**
 * SearchEngine - Advanced Search, Filtering, and Sorting Engine
 * Handles debounced query inputs, multi-field TMDb/IMDb search, genre filtering, and sorting.
 */

import { MediaAPI } from './api.js';

export class SearchEngine {
  constructor() {
    this.query = '';
    this.filters = {
      type: 'all',        // 'all', 'movie', 'tv'
      genre: 'all',       // Genre ID or 'all'
      minRating: 0,       // 0 to 9
      year: '',           // Release year
      sortBy: 'popularity'// 'popularity', 'rating', 'date', 'title'
    };
    this.debounceTimer = null;
  }

  /**
   * Set search query
   */
  setQuery(q) {
    this.query = q ? q.trim() : '';
  }

  /**
   * Set specific filter value
   */
  setFilter(key, value) {
    if (this.filters.hasOwnProperty(key)) {
      this.filters[key] = value;
    }
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    this.query = '';
    this.filters = {
      type: 'all',
      genre: 'all',
      minRating: 0,
      year: '',
      sortBy: 'popularity'
    };
  }

  /**
   * Perform search and apply filters and sorting
   */
  async executeSearch() {
    const rawResults = await MediaAPI.search(this.query, this.filters);
    return this.sortResults(rawResults);
  }

  /**
   * Sort array of media results
   */
  sortResults(results) {
    if (!Array.isArray(results)) return [];

    return [...results].sort((a, b) => {
      if (this.filters.sortBy === 'rating') {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      if (this.filters.sortBy === 'date') {
        const dateA = new Date(a.release_date || a.first_air_date || '1970-01-01');
        const dateB = new Date(b.release_date || b.first_air_date || '1970-01-01');
        return dateB - dateA;
      }
      if (this.filters.sortBy === 'title') {
        return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      }
      // Default: popularity / vote_count
      return (b.vote_count || 0) - (a.vote_count || 0);
    });
  }

  /**
   * Debounced search helper for live typing
   */
  debounceSearch(callback, delay = 300) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      const results = await this.executeSearch();
      callback(results);
    }, delay);
  }
}
