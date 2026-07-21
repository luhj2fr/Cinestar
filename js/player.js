/**
 * CustomPlayer - Hulu / Max Inspired Custom Streaming Video Player
 * Features glassmorphic neon controls, timeline hover preview tooltip, audio/subtitles,
 * skip intro & credits buttons, next episode countdown overlay, keyboard shortcuts, picture-in-picture, and watch history sync.
 */

import { StorageManager } from './storage.js';

export class CustomPlayer {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onClose = options.onClose || (() => {});
    this.onNextEpisode = options.onNextEpisode || null;
    
    this.mediaItem = null;
    this.video = null;
    this.wrapper = null;
    this.hideControlsTimer = null;
    this.progressInterval = null;
    this.isMiniPlayer = false;
    this.currentSubtitles = 'off';

    this.subtitlesData = {
      en: [
        { start: 2, end: 6, text: "Welcome to Cinestar Streaming." },
        { start: 8, end: 12, text: "Mankind was born on Earth. It was never meant to die here." },
        { start: 15, end: 20, text: "Searching for answers across the cosmos..." },
        { start: 25, end: 30, text: "[Dramatic orchestral score plays]" },
        { start: 40, end: 45, text: "Initiating trajectory calculation for docking." }
      ],
      es: [
        { start: 2, end: 6, text: "Bienvenido a Cinestar Streaming." },
        { start: 8, end: 12, text: "La humanidad nació en la Tierra. Nunca estuvo destinada a morir aquí." },
        { start: 15, end: 20, text: "Buscando respuestas a través del cosmos..." }
      ],
      fr: [
        { start: 2, end: 6, text: "Bienvenue sur Cinestar Streaming." },
        { start: 8, end: 12, text: "L'humanité est née sur Terre. Elle n'était pas destinée à y mourir." }
      ]
    };

    this.initDOM();
  }

  /**
   * Build HTML markup for player overlay matching Hulu & Max theme
   */
  initDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'custom-player-modal fixed inset-0 z-50 flex items-center justify-center bg-[#05030a] transition-opacity duration-300 opacity-0 pointer-events-none';
    this.wrapper.id = 'custom-player-wrapper';

    this.wrapper.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between overflow-hidden group/player" id="player-viewport">
        <!-- Embed Stream Iframe Container -->
        <div id="embed-iframe-wrapper" class="absolute inset-0 w-full h-full bg-black z-10 flex items-center justify-center">
          <iframe id="embed-iframe-element" class="w-full h-full border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; display-capture; accelerometer; gyroscope" allowfullscreen loading="eager" referrerpolicy="no-referrer-when-downgrade" style="will-change: transform; transform: translateZ(0); display: block;"></iframe>
        </div>

        <!-- Video Element -->
        <video id="main-video-element" class="w-full h-full object-contain cursor-pointer hidden z-0" playsinline></video>

        <!-- Stream Error Overlay -->
        <div id="player-error-overlay" class="hidden absolute inset-0 bg-[#080612]/95 backdrop-blur-2xl z-40 flex flex-col items-center justify-center text-center p-6">
          <div class="w-16 h-16 mb-4 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-2xl font-bold">
            ⚠️
          </div>
          <h3 class="text-xl md:text-2xl font-black text-white mb-2">Stream Playback Issue</h3>
          <p class="text-xs text-slate-300 max-w-md mb-6 leading-relaxed" id="player-error-msg">The video stream encountered a loading issue. Try switching servers or watching the trailer.</p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button id="player-retry-stream-btn" class="px-6 py-3 bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-2xl transition-transform hover:scale-105">
              Switch Server & Retry
            </button>
            <button id="player-watch-trailer-btn" class="px-6 py-3 bg-purple-900/60 hover:bg-purple-800 text-emerald-300 font-bold text-xs rounded-full border border-purple-500/40 transition-transform hover:scale-105">
              Watch Trailer
            </button>
            <button id="player-error-close-btn" class="px-6 py-3 bg-[#1a1438] hover:bg-purple-900/50 text-slate-300 hover:text-white font-bold text-xs rounded-full border border-purple-500/30">
              Close Player
            </button>
          </div>
        </div>

        <!-- Loading / Buffering Overlay -->
        <div id="player-loading-spinner" class="absolute inset-0 flex flex-col items-center justify-center bg-[#080612]/80 backdrop-blur-md transition-opacity duration-300 z-20">
          <div class="relative w-16 h-16 mb-4">
            <div class="absolute inset-0 border-4 border-purple-600/30 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span class="text-xs font-black tracking-widest text-emerald-400 uppercase">Connecting Stream...</span>
        </div>

        <!-- Subtitle Display overlay -->
        <div id="player-subtitle-box" class="absolute bottom-28 left-1/2 -translate-x-1/2 max-w-2xl px-6 py-2.5 bg-[#0d0a1f]/90 border border-purple-500/30 backdrop-blur-xl text-white text-center text-lg font-bold rounded-2xl shadow-2xl opacity-0 transition-opacity pointer-events-none z-20">
        </div>

        <!-- Skip Intro / Skip Credits Floating Buttons -->
        <div id="skip-button-container" class="absolute bottom-32 right-8 z-30 flex flex-col gap-3 pointer-events-auto">
          <button id="skip-intro-btn" class="hidden items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-black rounded-full shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider border border-purple-400/30">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 4l10 8-10 8V4zm11 0h3v16h-3V4z"/></svg>
            Skip Intro
          </button>
          <button id="skip-credits-btn" class="hidden items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-black rounded-full shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider border border-purple-400/30">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 4l10 8-10 8V4zm11 0h3v16h-3V4z"/></svg>
            Skip Credits
          </button>
        </div>

        <!-- Next Episode Countdown Banner -->
        <div id="next-episode-overlay" class="hidden absolute inset-0 bg-[#080612]/90 backdrop-blur-2xl z-40 flex flex-col items-center justify-center text-center p-6 transition-opacity">
          <span class="px-3 py-1 rounded bg-purple-600/80 text-white text-[10px] font-black uppercase tracking-widest mb-3 border border-purple-400/40">Up Next</span>
          <h3 id="next-ep-title" class="text-2xl md:text-4xl font-black text-white mb-2">Next Episode Title</h3>
          <p class="text-xs text-slate-300 max-w-md mb-8 leading-relaxed" id="next-ep-desc">Loading next episode...</p>
          <div class="flex items-center gap-4">
            <button id="play-next-now-btn" class="px-8 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center gap-2">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Play Now (<span id="next-countdown-num">5</span>s)
            </button>
            <button id="cancel-next-btn" class="px-6 py-3.5 bg-[#1a1438] hover:bg-purple-900/50 text-slate-300 hover:text-white font-bold text-xs rounded-full border border-purple-500/30 transition-colors">
              Cancel
            </button>
          </div>
        </div>

        <!-- Top Control Bar (Title, Season, Brand Badge, Server Selector, PiP, Close) -->
        <div id="player-top-bar" class="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-[#080612]/95 via-[#080612]/60 to-transparent transition-opacity duration-300 z-30 pointer-events-none">
          <div class="flex items-center gap-4 pointer-events-auto">
            <button id="player-back-btn" class="p-2.5 rounded-full bg-[#181236]/80 hover:bg-purple-900/60 text-white border border-purple-500/30 backdrop-blur-xl transition-all hover:scale-105" title="Go Back">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span id="player-badge" class="px-2 py-0.5 rounded bg-purple-600/90 text-white text-[9px] font-black uppercase">MAX ORIGINAL</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">4K HDR</span>
              </div>
              <h2 id="player-media-title" class="text-base md:text-lg font-black text-white tracking-tight">Media Title</h2>
              <p id="player-media-subtitle" class="text-xs text-purple-300 font-semibold"></p>
            </div>
          </div>

          <div class="flex items-center gap-3 pointer-events-auto">
            <!-- TV Season & Episode Controls (Visible for TV Shows) -->
            <div id="player-tv-controls" class="hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181236]/90 border border-purple-500/40 backdrop-blur-xl shadow-xl">
              <span class="text-[10px] font-black text-purple-300 uppercase tracking-wider hidden sm:inline">Episode:</span>
              <select id="player-season-select" class="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer">
                <option value="1" class="bg-[#0e0a24]">S1</option>
              </select>
              <select id="player-episode-select" class="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer">
                <option value="1" class="bg-[#0e0a24]">E1</option>
              </select>
              <button id="player-next-ep-btn" title="Next Episode" class="text-xs font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pl-1.5 border-l border-purple-500/30">
                <span class="hidden sm:inline">Next</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
              </button>
            </div>

            <!-- Server Selector Dropdown -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181236]/90 border border-purple-500/40 backdrop-blur-xl shadow-xl">
              <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider hidden sm:inline">Server:</span>
              <select id="player-server-select" class="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer">
                <option value="1" class="bg-[#0e0a24] text-white">Server 1 (Cinestar HTML5 MP4 Player - Default)</option>
                <option value="2" class="bg-[#0e0a24] text-white">Server 2 (VidLink HD PRO)</option>
                <option value="3" class="bg-[#0e0a24] text-white">Server 3 (VidSrc.me HD Stream)</option>
                <option value="4" class="bg-[#0e0a24] text-white">Server 4 (EmbedSu 4K HD)</option>
                <option value="5" class="bg-[#0e0a24] text-white">Server 5 (VidSrc CC HD)</option>
                <option value="6" class="bg-[#0e0a24] text-white">Server 6 (AutoEmbed Fast)</option>
                <option value="7" class="bg-[#0e0a24] text-white">Server 7 (2Embed HD Stream)</option>
                <option value="8" class="bg-[#0e0a24] text-white">Server 8 (Official HD Feature / Trailer)</option>
              </select>
            </div>

            <button id="player-pip-btn" title="Picture in Picture" class="p-2.5 rounded-full bg-[#181236]/80 hover:bg-purple-900/60 text-slate-300 hover:text-white border border-purple-500/30 backdrop-blur-xl transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </button>
            <button id="player-close-btn" title="Close Player" class="p-2.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 backdrop-blur-xl transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Big Center Play / Pause Gesture Overlay -->
        <div id="player-gesture-overlay" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 hidden">
          <div id="gesture-icon-box" class="w-20 h-20 rounded-full bg-[#120e24]/90 border border-purple-500/40 backdrop-blur-2xl flex items-center justify-center text-emerald-400 opacity-0 scale-50 transition-all duration-300 shadow-2xl">
            <svg id="gesture-play-svg" class="w-10 h-10 ml-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg id="gesture-pause-svg" class="w-10 h-10 hidden fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </div>
        </div>

        <!-- Bottom Glass Control Bar -->
        <div id="player-bottom-bar" class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#080612]/98 via-[#080612]/80 to-transparent transition-opacity duration-300 z-30 flex flex-col gap-3">
          
          <!-- Custom Progress Scrubber -->
          <div class="relative w-full group/scrub cursor-pointer py-2" id="progress-container">
            <!-- Time Hover Tooltip Badge -->
            <div id="progress-hover-tooltip" class="absolute -top-10 -translate-x-1/2 px-3 py-1 bg-[#0d0a1f]/95 text-emerald-300 text-xs font-mono font-bold rounded-xl shadow-2xl opacity-0 transition-opacity pointer-events-none border border-purple-500/40 backdrop-blur-xl">
              00:00
            </div>
            
            <div class="w-full h-1.5 group-hover/scrub:h-2.5 bg-slate-800/90 rounded-full overflow-hidden relative transition-all border border-purple-500/20">
              <!-- Buffer Range -->
              <div id="player-buffer-bar" class="absolute top-0 bottom-0 left-0 bg-purple-900/40 w-0 transition-all"></div>
              <!-- Played Progress -->
              <div id="player-played-bar" class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-emerald-400 w-0 transition-all relative">
                <div class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-300 rounded-full shadow-lg ring-2 ring-purple-600 scale-0 group-hover/scrub:scale-100 transition-transform"></div>
              </div>
            </div>
          </div>

          <!-- Controls row -->
          <div class="flex items-center justify-between">
            <!-- Left Controls: Play/Pause, Rewind, Forward, Volume, Time -->
            <div class="flex items-center gap-4">
              <button id="play-pause-btn" class="p-2 text-white hover:text-emerald-400 transition-colors">
                <svg id="btn-icon-play" class="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg id="btn-icon-pause" class="w-7 h-7 hidden fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>

              <button id="rewind-10-btn" title="Rewind 10s" class="p-1.5 text-slate-300 hover:text-emerald-400 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"/></svg>
              </button>

              <button id="forward-10-btn" title="Forward 10s" class="p-1.5 text-slate-300 hover:text-emerald-400 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z"/></svg>
              </button>

              <!-- Volume Control Slider -->
              <div class="flex items-center gap-2 group/vol">
                <button id="mute-btn" class="p-1.5 text-slate-300 hover:text-emerald-400 transition-colors">
                  <svg id="vol-high-svg" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"/></svg>
                  <svg id="vol-mute-svg" class="w-6 h-6 hidden text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                </button>
                <input id="volume-slider" type="range" min="0" max="1" step="0.05" value="0.8" class="w-20 accent-emerald-400 cursor-pointer h-1.5 rounded-lg bg-slate-800">
              </div>

              <!-- Time Display -->
              <div class="text-xs font-mono font-bold text-slate-300 ml-2">
                <span id="player-current-time" class="text-emerald-400">00:00</span> / <span id="player-total-duration">00:00</span>
              </div>
            </div>

            <!-- Right Controls: Speed, Subtitles, Fullscreen -->
            <div class="flex items-center gap-3">
              
              <!-- Subtitles Menu -->
              <div class="relative group/sub">
                <button id="subtitles-toggle-btn" class="px-3 py-1 text-xs font-black rounded-lg border border-purple-500/30 bg-[#16112e] text-slate-300 hover:text-emerald-400 hover:border-emerald-400 transition-all flex items-center gap-1">
                  CC
                </button>
                <div class="absolute bottom-11 right-0 w-36 bg-[#0d0a1f]/95 border border-purple-500/40 rounded-2xl shadow-2xl p-2 hidden group-hover/sub:block backdrop-blur-2xl z-40">
                  <div class="text-[10px] uppercase font-black text-purple-400 px-2 py-1">Subtitles</div>
                  <button data-sub="off" class="sub-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-white font-medium">Off</button>
                  <button data-sub="en" class="sub-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">English</button>
                  <button data-sub="es" class="sub-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">Spanish</button>
                  <button data-sub="fr" class="sub-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">French</button>
                </div>
              </div>

              <!-- Playback Speed Menu -->
              <div class="relative group/speed">
                <button id="speed-toggle-btn" class="px-3 py-1 text-xs font-black rounded-lg border border-purple-500/30 bg-[#16112e] text-slate-300 hover:text-emerald-400 hover:border-emerald-400 transition-all">
                  1.0x
                </button>
                <div class="absolute bottom-11 right-0 w-32 bg-[#0d0a1f]/95 border border-purple-500/40 rounded-2xl shadow-2xl p-2 hidden group-hover/speed:block backdrop-blur-2xl z-40">
                  <div class="text-[10px] uppercase font-black text-purple-400 px-2 py-1">Speed</div>
                  <button data-speed="0.5" class="speed-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">0.5x</button>
                  <button data-speed="0.75" class="speed-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">0.75x</button>
                  <button data-speed="1" class="speed-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 text-emerald-400 font-bold">1.0x (Normal)</button>
                  <button data-speed="1.25" class="speed-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">1.25x</button>
                  <button data-speed="1.5" class="speed-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">1.5x</button>
                  <button data-speed="2" class="speed-option-btn w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-purple-600/30 hover:text-emerald-300 text-slate-300">2.0x</button>
                </div>
              </div>

              <!-- Fullscreen Button -->
              <button id="fullscreen-btn" title="Toggle Fullscreen" class="p-2 text-slate-300 hover:text-emerald-400 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
              </button>

            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.wrapper);
    this.bindEvents();
  }

  /**
   * Bind event listeners for video player controls and keyboard shortcuts
   */
  bindEvents() {
    this.video = this.wrapper.querySelector('#main-video-element');
    const viewport = this.wrapper.querySelector('#player-viewport');
    const playPauseBtn = this.wrapper.querySelector('#play-pause-btn');
    const progressContainer = this.wrapper.querySelector('#progress-container');
    const progressHoverTooltip = this.wrapper.querySelector('#progress-hover-tooltip');
    const volumeSlider = this.wrapper.querySelector('#volume-slider');
    const muteBtn = this.wrapper.querySelector('#mute-btn');
    const closeBtn = this.wrapper.querySelector('#player-close-btn');
    const backBtn = this.wrapper.querySelector('#player-back-btn');
    const fullscreenBtn = this.wrapper.querySelector('#fullscreen-btn');
    const pipBtn = this.wrapper.querySelector('#player-pip-btn');
    const rewindBtn = this.wrapper.querySelector('#rewind-10-btn');
    const forwardBtn = this.wrapper.querySelector('#forward-10-btn');
    const skipIntroBtn = this.wrapper.querySelector('#skip-intro-btn');
    const skipCreditsBtn = this.wrapper.querySelector('#skip-credits-btn');

    // Toggle Play/Pause on Video Click or Button
    this.video.addEventListener('click', () => this.togglePlayPause());
    playPauseBtn.addEventListener('click', () => this.togglePlayPause());

    // Time & Progress Updates
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
    this.video.addEventListener('waiting', () => this.toggleLoading(true));
    this.video.addEventListener('playing', () => this.toggleLoading(false));
    this.video.addEventListener('ended', () => this.onEnded());
    this.video.addEventListener('error', (e) => {
      if (!this.video.getAttribute('src') || this.video.src === window.location.href) return;
      console.warn('Video element error caught:', e);
      this.handleStreamError();
    });

    const serverSelect = this.wrapper.querySelector('#player-server-select');
    if (serverSelect) {
      serverSelect.addEventListener('change', (e) => {
        this.switchServer(e.target.value);
      });
    }

    // TV Season & Episode Selectors
    const seasonSelect = this.wrapper.querySelector('#player-season-select');
    const episodeSelect = this.wrapper.querySelector('#player-episode-select');
    const nextEpBtn = this.wrapper.querySelector('#player-next-ep-btn');

    const changeTVEpisode = async (s, e) => {
      if (!this.mediaItem) return;
      this.mediaItem.season = Number(s);
      this.mediaItem.episode = Number(e);

      try {
        const seasonData = await MediaAPI.getTVSeasonDetails(this.mediaItem.id, this.mediaItem.season);
        const matchEp = seasonData?.episodes?.find(ep => Number(ep.episode_number) === Number(e));
        this.mediaItem.episodeTitle = matchEp ? matchEp.title : `Episode ${e}`;
      } catch (err) {
        this.mediaItem.episodeTitle = `Episode ${e}`;
      }

      const subtitleEl = this.wrapper.querySelector('#player-media-subtitle');
      if (subtitleEl) {
        subtitleEl.textContent = `Season ${this.mediaItem.season} • Episode ${this.mediaItem.episode} — ${this.mediaItem.episodeTitle}`;
      }

      this.playServer(this.currentServer || 1);
    };

    if (seasonSelect) {
      seasonSelect.addEventListener('change', async (ev) => {
        const newSeason = ev.target.value;
        if (episodeSelect) episodeSelect.value = '1';
        await changeTVEpisode(newSeason, 1);
      });
    }

    if (episodeSelect) {
      episodeSelect.addEventListener('change', async (ev) => {
        const newEp = ev.target.value;
        const currentSeason = seasonSelect ? seasonSelect.value : 1;
        await changeTVEpisode(currentSeason, newEp);
      });
    }

    if (nextEpBtn) {
      nextEpBtn.addEventListener('click', async () => {
        if (!this.mediaItem) return;
        const currentEp = Number(this.mediaItem.episode || 1);
        const nextEp = currentEp + 1;
        const currentSeason = Number(this.mediaItem.season || 1);
        
        if (episodeSelect) episodeSelect.value = String(nextEp);
        await changeTVEpisode(currentSeason, nextEp);
      });
    }

    const errorOverlay = this.wrapper.querySelector('#player-error-overlay');
    const retryStreamBtn = this.wrapper.querySelector('#player-retry-stream-btn');
    const watchTrailerBtn = this.wrapper.querySelector('#player-watch-trailer-btn');
    const errorCloseBtn = this.wrapper.querySelector('#player-error-close-btn');

    if (retryStreamBtn) {
      retryStreamBtn.addEventListener('click', () => {
        errorOverlay.classList.add('hidden');
        const nextServer = ((this.currentServer || 1) % 6) + 1;
        this.switchServer(nextServer);
      });
    }

    if (watchTrailerBtn) {
      watchTrailerBtn.addEventListener('click', () => {
        errorOverlay.classList.add('hidden');
        const trailerKey = this.mediaItem?.trailer_key || 'YoHD9XEInc0';
        this.close();
        window.dispatchEvent(new CustomEvent('open-trailer-event', { detail: trailerKey }));
      });
    }

    if (errorCloseBtn) {
      errorCloseBtn.addEventListener('click', () => {
        errorOverlay.classList.add('hidden');
        this.close();
      });
    }

    // Scrubber Dragging / Seeking
    let isSeeking = false;
    const handleSeek = (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (this.video.duration) {
        this.video.currentTime = pos * this.video.duration;
      }
    };

    progressContainer.addEventListener('mousedown', (e) => {
      isSeeking = true;
      handleSeek(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isSeeking) handleSeek(e);

      // Tooltip Hover
      if (progressContainer.contains(e.target) && this.video.duration) {
        const rect = progressContainer.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const hoverTime = pos * this.video.duration;
        progressHoverTooltip.textContent = this.formatTime(hoverTime);
        progressHoverTooltip.style.left = `${pos * 100}%`;
        progressHoverTooltip.style.opacity = '1';
      } else {
        progressHoverTooltip.style.opacity = '0';
      }
    });

    window.addEventListener('mouseup', () => { isSeeking = false; });

    // Volume & Mute
    volumeSlider.addEventListener('input', (e) => {
      this.video.volume = parseFloat(e.target.value);
      this.video.muted = this.video.volume === 0;
      this.updateVolumeIcons();
    });

    muteBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      this.updateVolumeIcons();
    });

    // Rewind / Fast Forward
    rewindBtn.addEventListener('click', () => { this.video.currentTime = Math.max(0, this.video.currentTime - 10); });
    forwardBtn.addEventListener('click', () => { this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10); });

    // Skip Intro & Credits
    skipIntroBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.introSkipped = true;

      if (this.mediaItem?.skip_intro) {
        this.video.currentTime = this.mediaItem.skip_intro.end;
      } else {
        const targetTime = Math.max(92, this.video.currentTime + 85);
        if (this.video.duration) {
          this.video.currentTime = Math.min(this.video.duration - 5, targetTime);
        } else {
          this.video.currentTime = targetTime;
        }
      }

      skipIntroBtn.classList.add('hidden');
      skipIntroBtn.classList.remove('flex');

      // Make other UI controls appear and then auto-disappear
      this.resetControlsTimer();
    });

    skipCreditsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.creditsSkipped = true;

      if (this.mediaItem?.skip_credits) {
        this.video.currentTime = this.mediaItem.skip_credits.end;
      } else {
        this.onEnded();
      }

      skipCreditsBtn.classList.add('hidden');
      skipCreditsBtn.classList.remove('flex');

      // Make other UI controls appear and then auto-disappear
      this.resetControlsTimer();
    });

    // Playback Speed Options
    this.wrapper.querySelectorAll('.speed-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        this.video.playbackRate = speed;
        this.wrapper.querySelector('#speed-toggle-btn').textContent = `${speed}x`;
      });
    });

    // Subtitle Options
    this.wrapper.querySelectorAll('.sub-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentSubtitles = e.target.dataset.sub;
        this.wrapper.querySelector('#subtitles-toggle-btn').classList.toggle('border-emerald-400', this.currentSubtitles !== 'off');
      });
    });

    // Fullscreen & PiP
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    pipBtn.addEventListener('click', () => this.togglePiP());

    // Close & Back
    closeBtn.addEventListener('click', () => this.close());
    backBtn.addEventListener('click', () => this.close());

    // Mouse movement auto-hide controls
    viewport.addEventListener('mousemove', () => this.resetControlsTimer());

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (!this.wrapper.classList.contains('pointer-events-auto')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); this.togglePlayPause(); }
      if (e.key === 'f') { e.preventDefault(); this.toggleFullscreen(); }
      if (e.key === 'm') { e.preventDefault(); this.video.muted = !this.video.muted; this.updateVolumeIcons(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.video.currentTime += 10; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.video.currentTime -= 10; }
      if (e.key === 'Escape') { this.close(); }
    });
  }

  /**
   * Construct embed streaming URL for various high-definition sources
   */
  getEmbedUrl(serverIndex, mediaItem) {
    if (!mediaItem) return null;
    const type = mediaItem.type === 'tv' ? 'tv' : 'movie';
    const id = mediaItem.id || mediaItem.tmdb_id || 157336;
    const s = mediaItem.season || 1;
    const e = mediaItem.episode || 1;
    const trailerKey = mediaItem.trailer_key || 'uYPbbksJxIg';

    switch (Number(serverIndex)) {
      case 2:
        // Server 2: VidLink HD PRO
        return type === 'tv'
          ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=a855f7&secondaryColor=10b981&iconColor=ffffff&autoplay=true`
          : `https://vidlink.pro/movie/${id}?primaryColor=a855f7&secondaryColor=10b981&iconColor=ffffff&autoplay=true`;
      case 3:
        // Server 3: VidSrc.me HD Stream
        return type === 'tv'
          ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
          : `https://vidsrc.me/embed/movie?tmdb=${id}`;
      case 4:
        // Server 4: EmbedSu 4K HD
        return type === 'tv'
          ? `https://embed.su/embed/tv/${id}/${s}/${e}`
          : `https://embed.su/embed/movie/${id}`;
      case 5:
        // Server 5: VidSrc CC HD
        return type === 'tv'
          ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
          : `https://vidsrc.cc/v2/embed/movie/${id}`;
      case 6:
        // Server 6: AutoEmbed Fast
        return type === 'tv'
          ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
          : `https://player.autoembed.cc/embed/movie/${id}`;
      case 7:
        // Server 7: 2Embed HD Stream
        return type === 'tv'
          ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
          : `https://www.2embed.cc/embed/${id}`;
      case 8:
        // Server 8: Official YouTube Feature / Trailer HD
        return `https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`;
      default:
        return null;
    }
  }

  /**
   * Load and play a media item
   */
  async loadMedia(mediaItem, resumeTime = 0) {
    if (!mediaItem) return;

    this.wrapper.classList.remove('opacity-0', 'pointer-events-none');
    this.wrapper.classList.add('opacity-100', 'pointer-events-auto');
    this.toggleLoading(true);

    const errorOverlay = this.wrapper.querySelector('#player-error-overlay');
    if (errorOverlay) errorOverlay.classList.add('hidden');

    // Fetch full details via TMDb API to guarantee we have exact trailer_key, videos, IMDb ID, and metadata
    if (!mediaItem.trailer_key || !mediaItem.imdb_id) {
      try {
        const fullDetails = await MediaAPI.getDetails(mediaItem.id || 157336, mediaItem.type || 'movie');
        if (fullDetails) {
          mediaItem = {
            ...fullDetails,
            ...mediaItem,
            trailer_key: fullDetails.trailer_key || mediaItem.trailer_key,
            imdb_id: fullDetails.imdb_id || mediaItem.imdb_id
          };
        }
      } catch (err) {
        console.warn('MediaAPI: Could not fetch additional TMDb video details:', err);
      }
    }

    // Handle TV Show episode details and season selectors
    if (mediaItem.type === 'tv') {
      if (!mediaItem.season) mediaItem.season = 1;
      if (!mediaItem.episode) mediaItem.episode = 1;

      const tvControls = this.wrapper.querySelector('#player-tv-controls');
      const seasonSelect = this.wrapper.querySelector('#player-season-select');
      const episodeSelect = this.wrapper.querySelector('#player-episode-select');

      if (tvControls) tvControls.classList.remove('hidden');

      const seasonsCount = mediaItem.seasons_count || 5;
      if (seasonSelect) {
        seasonSelect.innerHTML = Array.from({ length: seasonsCount }).map((_, idx) => `
          <option value="${idx + 1}" class="bg-[#0e0a24]">S${idx + 1}</option>
        `).join('');
        seasonSelect.value = mediaItem.season;
      }

      try {
        const seasonData = await MediaAPI.getTVSeasonDetails(mediaItem.id, mediaItem.season);
        const epCount = seasonData?.episodes?.length || 12;

        if (episodeSelect) {
          episodeSelect.innerHTML = Array.from({ length: epCount }).map((_, idx) => `
            <option value="${idx + 1}" class="bg-[#0e0a24]">E${idx + 1}</option>
          `).join('');
          episodeSelect.value = mediaItem.episode;
        }

        const matchEp = seasonData?.episodes?.find(ep => Number(ep.episode_number) === Number(mediaItem.episode));
        if (matchEp) {
          mediaItem.episodeTitle = matchEp.title;
        }
      } catch (err) {
        console.warn('Could not fetch TV season details in player loadMedia:', err);
      }
    } else {
      const tvControls = this.wrapper.querySelector('#player-tv-controls');
      if (tvControls) tvControls.classList.add('hidden');
    }

    this.mediaItem = mediaItem;
    this.currentServer = 1;
    this.introSkipped = false;
    this.creditsSkipped = false;

    // Title setup
    const titleEl = this.wrapper.querySelector('#player-media-title');
    const subtitleEl = this.wrapper.querySelector('#player-media-subtitle');
    const badgeEl = this.wrapper.querySelector('#player-badge');

    if (badgeEl) badgeEl.textContent = mediaItem.badge || (mediaItem.type === 'tv' ? 'SERIES' : 'HBO ORIGINAL');
    if (titleEl) titleEl.textContent = mediaItem.title || mediaItem.name || 'Cinestar Media';

    if (mediaItem.season && mediaItem.episode) {
      if (subtitleEl) subtitleEl.textContent = `Season ${mediaItem.season} • Episode ${mediaItem.episode} — ${mediaItem.episodeTitle || `Episode ${mediaItem.episode}`}`;
    } else {
      if (subtitleEl) subtitleEl.textContent = `${mediaItem.year || '2024'} • ${mediaItem.genres ? mediaItem.genres.map(g => g.name || g).join(', ') : 'Feature'}`;
    }

    const serverSelect = this.wrapper.querySelector('#player-server-select');
    if (serverSelect) serverSelect.value = '1';

    this.playServer(1);
    this.resetControlsTimer();
  }

  /**
   * Play stream using selected server
   */
  playServer(serverIndex) {
    this.currentServer = Number(serverIndex);
    const iframeWrapper = this.wrapper.querySelector('#embed-iframe-wrapper');
    const iframe = this.wrapper.querySelector('#embed-iframe-element');
    const mainVideo = this.video;
    const bottomBar = this.wrapper.querySelector('#player-bottom-bar');

    this.toggleLoading(true);

    // Server 1: Native Cinestar Custom HTML5 MP4 Player with custom bottom control bar
    if (this.currentServer === 1) {
      if (iframeWrapper) iframeWrapper.classList.add('hidden');
      if (iframe) iframe.src = '';

      if (mainVideo) {
        mainVideo.classList.remove('hidden');
        if (bottomBar) bottomBar.classList.remove('hidden');

        const fallbackStreams = [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyplays.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
          'https://vjs.zencdn.net/v/oceans.mp4',
          'https://media.w3.org/2010/05/sintel/trailer.mp4',
          'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
        ];

        const idNum = Math.abs(this.mediaItem?.id || 0) + (this.mediaItem?.season || 0) * 10 + (this.mediaItem?.episode || 0);
        const streamIndex = idNum % fallbackStreams.length;
        const streamUrl = this.mediaItem?.stream_url || fallbackStreams[streamIndex];

        mainVideo.src = streamUrl;
        mainVideo.load();

        const settings = StorageManager.getSettings();
        mainVideo.volume = settings.volume || 0.8;
        mainVideo.playbackRate = 1.0;

        mainVideo.play().then(() => {
          this.toggleLoading(false);
          this.updatePlayPauseIcons(true);
        }).catch(() => {
          mainVideo.muted = true;
          this.updateVolumeIcons();
          mainVideo.play().then(() => {
            this.toggleLoading(false);
            this.updatePlayPauseIcons(true);
          }).catch(() => {
            this.handleStreamError();
          });
        });
        return;
      }
    }

    // Servers 2 - 8: High-Definition Embedded Video Streams (VidLink, VidSrc, EmbedSu, VidSrc CC, AutoEmbed, 2Embed, YouTube)
    if (this.currentServer >= 2 && this.currentServer <= 8) {
      const embedUrl = this.getEmbedUrl(this.currentServer, this.mediaItem);
      if (embedUrl) {
        if (iframe) {
          if (iframe.src !== embedUrl) {
            iframe.src = embedUrl;
          }
        }

        if (iframeWrapper) iframeWrapper.classList.remove('hidden');
        if (mainVideo) {
          mainVideo.pause();
          mainVideo.classList.add('hidden');
        }
        // Hide Cinestar's bottom control bar when using embedded players to prevent duplicate control bars
        if (bottomBar) bottomBar.classList.add('hidden');

        // Safety fallback timer to hide spinner
        setTimeout(() => this.toggleLoading(false), 600);
        return;
      }
    }

    this.handleStreamError();
  }

  /**
   * Switch player server
   */
  switchServer(serverIndex) {
    const errorOverlay = this.wrapper.querySelector('#player-error-overlay');
    if (errorOverlay) errorOverlay.classList.add('hidden');
    const serverSelect = this.wrapper.querySelector('#player-server-select');
    if (serverSelect) serverSelect.value = String(serverIndex);
    this.playServer(serverIndex);
  }

  /**
   * Toggle Play / Pause state
   */
  togglePlayPause() {
    if (this.video.paused) {
      this.video.play();
      this.updatePlayPauseIcons(true);
      this.showGestureRipple('play');
    } else {
      this.video.pause();
      this.updatePlayPauseIcons(false);
      this.showGestureRipple('pause');
    }
  }

  /**
   * Show central play/pause gesture ripple animation
   */
  showGestureRipple(type) {
    const gestureBox = this.wrapper.querySelector('#gesture-icon-box');
    const playSvg = this.wrapper.querySelector('#gesture-play-svg');
    const pauseSvg = this.wrapper.querySelector('#gesture-pause-svg');

    if (type === 'play') {
      playSvg.classList.remove('hidden');
      pauseSvg.classList.add('hidden');
    } else {
      playSvg.classList.add('hidden');
      pauseSvg.classList.remove('hidden');
    }

    gestureBox.classList.remove('opacity-0', 'scale-50');
    gestureBox.classList.add('opacity-100', 'scale-110');

    setTimeout(() => {
      gestureBox.classList.remove('opacity-100', 'scale-110');
      gestureBox.classList.add('opacity-0', 'scale-50');
    }, 400);
  }

  /**
   * Update UI Play/Pause button state
   */
  updatePlayPauseIcons(isPlaying) {
    const playIcon = this.wrapper.querySelector('#btn-icon-play');
    const pauseIcon = this.wrapper.querySelector('#btn-icon-pause');
    if (isPlaying) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
  }

  /**
   * Update Volume icon state
   */
  updateVolumeIcons() {
    const highSvg = this.wrapper.querySelector('#vol-high-svg');
    const muteSvg = this.wrapper.querySelector('#vol-mute-svg');
    if (this.video.muted || this.video.volume === 0) {
      highSvg.classList.add('hidden');
      muteSvg.classList.remove('hidden');
    } else {
      highSvg.classList.remove('hidden');
      muteSvg.classList.add('hidden');
    }
  }

  /**
   * Handle time update event
   */
  onTimeUpdate() {
    if (!this.video.duration) return;

    const current = this.video.currentTime;
    const duration = this.video.duration;
    const progressPercent = (current / duration) * 100;

    // Update Progress Bars
    const playedBar = this.wrapper.querySelector('#player-played-bar');
    playedBar.style.width = `${progressPercent}%`;

    if (this.video.buffered.length > 0) {
      const bufferEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const bufferPercent = (bufferEnd / duration) * 100;
      this.wrapper.querySelector('#player-buffer-bar').style.width = `${bufferPercent}%`;
    }

    // Time Labels
    this.wrapper.querySelector('#player-current-time').textContent = this.formatTime(current);
    this.wrapper.querySelector('#player-total-duration').textContent = this.formatTime(duration);

    // Save Progress to Watch History periodically
    if (this.mediaItem && Math.floor(current) % 3 === 0) {
      StorageManager.updateProgress(this.mediaItem, current, duration);
    }

    // Check Subtitles
    this.renderSubtitles(current);

    // Skip Intro / Credits buttons
    this.checkSkipButtons(current, duration);
  }

  /**
   * Render custom inline subtitles based on timestamp
   */
  renderSubtitles(currentTime) {
    const subBox = this.wrapper.querySelector('#player-subtitle-box');
    if (this.currentSubtitles === 'off' || !this.subtitlesData[this.currentSubtitles]) {
      subBox.classList.add('opacity-0');
      return;
    }

    const lines = this.subtitlesData[this.currentSubtitles];
    const currentLine = lines.find(l => currentTime >= l.start && currentTime <= l.end);

    if (currentLine) {
      subBox.textContent = currentLine.text;
      subBox.classList.remove('opacity-0');
    } else {
      subBox.classList.add('opacity-0');
    }
  }

  /**
   * Show/Hide Skip Intro & Skip Credits triggers
   */
  checkSkipButtons(currentTime, duration) {
    const skipIntroBtn = this.wrapper.querySelector('#skip-intro-btn');
    const skipCreditsBtn = this.wrapper.querySelector('#skip-credits-btn');

    // Show Skip Intro during first 90 seconds
    if (currentTime >= 10 && currentTime <= 90) {
      skipIntroBtn.classList.remove('hidden');
      skipIntroBtn.classList.add('flex');
    } else {
      skipIntroBtn.classList.add('hidden');
      skipIntroBtn.classList.remove('flex');
    }

    // Show Skip Credits in the final 2 minutes
    if (duration - currentTime <= 120 && duration - currentTime >= 10) {
      skipCreditsBtn.classList.remove('hidden');
      skipCreditsBtn.classList.add('flex');
    } else {
      skipCreditsBtn.classList.add('hidden');
      skipCreditsBtn.classList.remove('flex');
    }
  }

  /**
   * Metadata loaded handler
   */
  onMetadataLoaded() {
    this.wrapper.querySelector('#player-total-duration').textContent = this.formatTime(this.video.duration);
  }

  /**
   * Toggle loading spinner
   */
  toggleLoading(isLoading) {
    const spinner = this.wrapper.querySelector('#player-loading-spinner');
    if (!spinner) return;
    if (isLoading) {
      spinner.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
    } else {
      spinner.classList.add('opacity-0', 'pointer-events-none', 'hidden');
    }
  }

  /**
   * On Video Ended - auto show Next Episode countdown if available
   */
  onEnded() {
    if (this.mediaItem) {
      StorageManager.updateProgress(this.mediaItem, this.video.duration, this.video.duration);
    }

    if (this.onNextEpisode) {
      this.showNextEpisodeOverlay();
    } else {
      this.close();
    }
  }

  /**
   * Show countdown for next episode
   */
  showNextEpisodeOverlay() {
    const overlay = this.wrapper.querySelector('#next-episode-overlay');
    const countdownNum = this.wrapper.querySelector('#next-countdown-num');
    const playNextBtn = this.wrapper.querySelector('#play-next-now-btn');
    const cancelBtn = this.wrapper.querySelector('#cancel-next-btn');

    overlay.classList.remove('hidden');

    let count = 5;
    countdownNum.textContent = count;

    const timer = setInterval(() => {
      count -= 1;
      countdownNum.textContent = count;
      if (count <= 0) {
        clearInterval(timer);
        overlay.classList.add('hidden');
        if (this.onNextEpisode) this.onNextEpisode();
      }
    }, 1000);

    playNextBtn.onclick = () => {
      clearInterval(timer);
      overlay.classList.add('hidden');
      if (this.onNextEpisode) this.onNextEpisode();
    };

    cancelBtn.onclick = () => {
      clearInterval(timer);
      overlay.classList.add('hidden');
    };
  }

  /**
   * Auto-hide controls bar on inactivity
   */
  resetControlsTimer() {
    const topBar = this.wrapper.querySelector('#player-top-bar');
    const bottomBar = this.wrapper.querySelector('#player-bottom-bar');
    const viewport = this.wrapper.querySelector('#player-viewport');

    if (topBar) {
      topBar.classList.remove('opacity-0', 'pointer-events-none');
      topBar.classList.add('opacity-100');
    }

    if (this.currentServer === 1) {
      if (bottomBar) {
        bottomBar.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        bottomBar.classList.add('opacity-100');
      }
      if (viewport) viewport.style.cursor = 'default';

      clearTimeout(this.hideControlsTimer);
      this.hideControlsTimer = setTimeout(() => {
        if (bottomBar) {
          bottomBar.classList.remove('opacity-100');
          bottomBar.classList.add('opacity-0', 'pointer-events-none');
        }
        if (viewport) viewport.style.cursor = 'none';
      }, 3500);
    } else {
      if (bottomBar) bottomBar.classList.add('hidden');
      if (viewport) viewport.style.cursor = 'default';
    }
  }

  /**
   * Toggle Picture-in-Picture
   */
  async togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && this.video) {
        await this.video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP failed', e);
    }
  }

  /**
   * Toggle Fullscreen
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.wrapper.requestFullscreen().catch(err => console.warn('Fullscreen error', err));
    } else {
      document.exitFullscreen().catch(err => console.warn('Exit fullscreen error', err));
    }
  }

  /**
   * Format seconds to HH:MM:SS or MM:SS
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (num) => String(num).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  /**
   * Handle video stream loading failure
   */
  handleStreamError() {
    this.toggleLoading(false);
    const nextServer = ((this.currentServer || 1) % 8) + 1;
    if (nextServer !== 1) {
      this.switchServer(nextServer);
    } else {
      this.showErrorOverlay('Unable to load video stream from current server. You can switch servers using the dropdown above or watch the official HD feature/trailer below.');
    }
  }

  /**
   * Display stream error overlay
   */
  showErrorOverlay(msg) {
    const errorOverlay = this.wrapper.querySelector('#player-error-overlay');
    const errorMsg = this.wrapper.querySelector('#player-error-msg');
    if (errorMsg) errorMsg.textContent = msg || 'Playback error occurred.';
    if (errorOverlay) errorOverlay.classList.remove('hidden');
  }

  /**
   * Close video player
   */
  close() {
    const iframe = this.wrapper.querySelector('#embed-iframe-element');
    if (iframe) iframe.src = '';

    if (this.video) {
      if (this.mediaItem && this.video.currentTime > 2) {
        StorageManager.updateProgress(this.mediaItem, this.video.currentTime, this.video.duration || 100);
      }
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
    }

    const errorOverlay = this.wrapper.querySelector('#player-error-overlay');
    if (errorOverlay) errorOverlay.classList.add('hidden');

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    this.wrapper.classList.remove('opacity-100', 'pointer-events-auto');
    this.wrapper.classList.add('opacity-0', 'pointer-events-none');

    if (this.onClose) this.onClose();
  }
}
