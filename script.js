// Global State
let youtubePlayer;
let currentVideoId = localStorage.getItem('lastSelectedVideo') || 'RUQcm3vIbWo'; // Load last or default
let progressInterval;

// DOM Elements
const statusEl = document.getElementById('statusMessage');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const classListUl = document.getElementById('classList');

// --- 1. Utility Functions ---

function showStatusMessage(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = `status-message ${isError ? 'error' : ''}`; // Add specific error styling in CSS if needed
  statusEl.style.background = isError ? '#e53e3e' : '#38b2ac';

  // Force reflow for restart animation
  void statusEl.offsetWidth; 
  statusEl.classList.add('show');

  // Clear previous timer if exists to prevent overlapping
  if (statusEl.hideTimer) clearTimeout(statusEl.hideTimer);
  
  statusEl.hideTimer = setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

// --- 2. YouTube API Logic ---

function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player('player', {
    height: '100%',
    width: '100%',
    // FIX: Do not set videoId here immediately to prevent double loading
    // We will load the correct video in onPlayerReady
    playerVars: {
      'playsinline': 1,
      'rel': 0,
      'modestbranding': 1,
      'showinfo': 0,
      'iv_load_policy': 3 // Hide annotations
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  console.log('Player Ready');
  
  // FIX: Load the last video AND the last timestamp together
  const savedTime = parseFloat(localStorage.getItem(`videoProgress_${currentVideoId}`)) || 0;
  
  event.target.loadVideoById({
    videoId: currentVideoId,
    startSeconds: savedTime
  });

  // Sync UI to match the video we just loaded
  highlightClassItem(currentVideoId);
  showStatusMessage('Player ready. Resuming session...');
}

function onPlayerStateChange(event) {
  // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
  if (event.data === YT.PlayerState.PLAYING) {
    startProgressTracking();
  } else {
    stopProgressTracking();
    // Save immediately on pause for precision
    saveCurrentProgress(); 
  }
}

function changeVideo(videoId) {
  if (!youtubePlayer || !youtubePlayer.loadVideoById) return;

  // 1. Save progress of the PREVIOUS video before switching
  saveCurrentProgress();

  // 2. Get progress of the NEW video
  const savedTime = parseFloat(localStorage.getItem(`videoProgress_${videoId}`)) || 0;

  // 3. Update State
  currentVideoId = videoId;
  localStorage.setItem('lastSelectedVideo', videoId);

  // 4. Load new video at exact start time (FIX: No seekTo needed)
  youtubePlayer.loadVideoById({
    videoId: videoId,
    startSeconds: savedTime
  });

  console.log(`Switched to ${videoId} at ${savedTime}s`);
}

// --- 3. Progress Tracking ---

function saveCurrentProgress() {
  if (youtubePlayer && youtubePlayer.getCurrentTime) {
    const time = youtubePlayer.getCurrentTime();
    if (time > 0) {
      localStorage.setItem(`videoProgress_${currentVideoId}`, time.toFixed(2));
    }
  }
}

function startProgressTracking() {
  stopProgressTracking(); // Prevent duplicates
  progressInterval = setInterval(saveCurrentProgress, 5000); // Save every 5s
}

function stopProgressTracking() {
  if (progressInterval) clearInterval(progressInterval);
}

// --- 4. UI Logic ---

function highlightClassItem(videoId) {
  const items = document.querySelectorAll('.class-item');
  
  items.forEach(item => {
    if (item.dataset.vid === videoId) {
      item.classList.add('active');
      
      // Update PDF Button logic
      const pdfLink = item.dataset.npdf;
      if (pdfLink) {
        downloadPdfBtn.href = `https://www.bondipathshala.com.bd/pdf/${pdfLink}`;
        downloadPdfBtn.classList.remove('hidden');
      } else {
        downloadPdfBtn.classList.add('hidden');
      }

      // Scroll into view if needed
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

function renderClassList() {
  const storedVideos = JSON.parse(localStorage.getItem('customVideos')) || [];
  
  // Clear existing list to prevent duplicates
  classListUl.innerHTML = '';

  storedVideos.forEach(video => {
    const li = document.createElement('li');
    li.className = 'class-item';
    li.dataset.vid = video.id;
    li.dataset.nname = video.title;
    li.dataset.npdf = video.pdfLink || '';
    
    // Modern HTML structure
    li.innerHTML = `
      <span class="class-title bengali-text">${video.title}</span>
      ${video.pdfLink ? `<i class="fas fa-file-pdf" style="color: var(--success)"></i>` : ''}
    `;
    
    // Event Listener (Delegated logic per item)
    li.addEventListener('click', () => {
      // Don't reload if clicking the same video
      if (currentVideoId === video.id) return;
      
      highlightClassItem(video.id);
      changeVideo(video.id);
      showStatusMessage(`Playing: ${video.title}`);
    });

    classListUl.appendChild(li);
  });
}

// --- 5. Inputs & Keyboard ---

// Custom Share
const customShareBtn = document.getElementById('customShareBtn');
if (customShareBtn) {
  customShareBtn.addEventListener('click', async () => {
    if (!currentVideoId) return;
    
    const url = `https://www.youtube.com/watch?v=${currentVideoId}`;
    
    // Modern Share API support
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bondi Pathshala Class',
          text: 'Watch this class!',
          url: url
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(url);
      showStatusMessage('Link copied to clipboard!');
    }
  });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (!youtubePlayer || !youtubePlayer.getVolume) return;

  const key = e.key.toLowerCase();

  switch (key) {
    case 'u': // Vol Up
      youtubePlayer.setVolume(Math.min(100, youtubePlayer.getVolume() + 10));
      showStatusMessage(`Volume: ${youtubePlayer.getVolume()}%`);
      break;
    case 'd': // Vol Down
      youtubePlayer.setVolume(Math.max(0, youtubePlayer.getVolume() - 10));
      showStatusMessage(`Volume: ${youtubePlayer.getVolume()}%`);
      break;
    case 'f': // Fullscreen
      const iframe = document.getElementById('player');
      if (!document.fullscreenElement) {
        iframe.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen();
      }
      break;
    case ' ': // Play/Pause
    case 'k':
      e.preventDefault();
      const state = youtubePlayer.getPlayerState();
      state === 1 ? youtubePlayer.pauseVideo() : youtubePlayer.playVideo();
      break;
    case 'arrowright': // Seek forward 5s
      e.preventDefault();
      youtubePlayer.seekTo(youtubePlayer.getCurrentTime() + 5, true);
      break;
    case 'arrowleft': // Seek back 5s
      e.preventDefault();
      youtubePlayer.seekTo(youtubePlayer.getCurrentTime() - 5, true);
      break;
  }
});

// --- 6. Initialization ---

// Render list immediately
renderClassList();

// Save state when closing/refreshing tab
window.addEventListener('beforeunload', () => {
  saveCurrentProgress();
});
