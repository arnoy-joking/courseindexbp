// --- Page namespace extracted from filename ---
const PAGE_NAMESPACE = (() => {
  const path = window.location.pathname;
  const matches = path.match(/([^\/]+)\.html?$/i);
  return (matches && matches[1]) ? matches[1] : 'default';
})();

// --- Functions for namespaced localStorage keys ---
function getProgressKey(videoId) {
  return `${PAGE_NAMESPACE}_videoProgress_${videoId}`;
}
function getLastSelectedKey() {
  return `${PAGE_NAMESPACE}_lastSelectedVideo`;
}
function getCustomVideosKey() {
  return `${PAGE_NAMESPACE}_customVideos`;
}

// Global variables
let currentVideoId = 'RUQcm3vIbWo'; // Default video ID
let youtubePlayer;

// Function to show status messages
function showStatusMessage(message, isError = false) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = 'status-message';
  statusEl.style.background = isError ? '#e53e3e' : '#38b2ac';

  setTimeout(() => {
    statusEl.classList.add('show');
  }, 10);

  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

// Initialize YouTube Player
function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: currentVideoId,
    playerVars: {
      'playsinline': 1,
      'rel': 0,
      'modestbranding': 1,
      'showinfo': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  console.log('YouTube player is ready');
  showStatusMessage('Player is ready. Select a class to start learning!');

  // DELAYED AUTO-LOAD LOGIC FOR LAST PLAYED VIDEO, NAMESPACED
  setTimeout(() => {
    const lastVideoId = localStorage.getItem(getLastSelectedKey());
    if (lastVideoId && lastVideoId !== currentVideoId) {
      // Try selecting the corresponding class item & loading the video
      const lastItem = [...document.querySelectorAll('.class-item')].find(item => item.dataset.vid === lastVideoId);
      if (lastItem) {
        lastItem.click();
        lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        changeVideo(lastVideoId);
      }
    } else if (!lastVideoId) {
      // Select first video by default if none is saved
      const firstItem = document.querySelector('.class-item');
      if (firstItem) {
        firstItem.click();
      }
    }
  }, 2500); // 2.5s delay to let the player embed first
}

function onPlayerStateChange(event) {
  // You can add custom behavior based on player state changes
}

// Function to change video
function changeVideo(videoId) {
  if (youtubePlayer && youtubePlayer.loadVideoById) {
    youtubePlayer.loadVideoById(videoId);
    currentVideoId = videoId;
    console.log(`Changed video to: ${videoId}`);
    // Load saved progress if available, namespaced
    setTimeout(() => {
      const progressKey = getProgressKey(videoId);
      const savedTime = parseFloat(localStorage.getItem(progressKey));
      if (!isNaN(savedTime) && savedTime > 0) {
        youtubePlayer.seekTo(savedTime, true);
        console.log(`Resumed from saved time: ${savedTime.toFixed(2)}s`);
      }
    }, 500);
  }
}

// Handle class selection
function attachClassItemListeners() {
  const classItems = document.querySelectorAll('.class-item');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  classItems.forEach(item => {
    item.addEventListener('click', () => {
      const videoId = item.dataset.vid;
      const className = item.dataset.nname;

      // Update current video
      currentVideoId = videoId;
      localStorage.setItem(getLastSelectedKey(), videoId);

      // Change the video
      changeVideo(videoId);

      // Update UI
      classItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update PDF link
      const pdfLink = item.dataset.npdf;
      if (pdfLink) {
        downloadPdfBtn.href = `https://www.bondipathshala.com.bd/pdf/${pdfLink}`;
        downloadPdfBtn.classList.remove('hidden');
      } else {
        downloadPdfBtn.classList.add('hidden');
      }

      // Show status message
      showStatusMessage(`Now playing: ${className}`);
    });
  });
}

// Custom Share Button Functionality
const customShareBtn = document.getElementById('customShareBtn');
if (customShareBtn) {
  customShareBtn.addEventListener('click', () => {
    if (currentVideoId) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
      if (navigator.share) {
        navigator.share({
          title: 'Bondi Pathshala Video',
          text: 'Check out this educational video from Bondi Pathshala',
          url: youtubeUrl
        }).catch(err => {
          console.error('Error sharing:', err);
        });
      } else {
        navigator.clipboard.writeText(youtubeUrl).then(() => {
          showStatusMessage('Video link copied to clipboard!');
        }).catch(err => {
          console.error('Failed to copy video link: ', err);
          showStatusMessage('Failed to copy video link. Please try again.', true);
        });
      }
    } else {
      showStatusMessage('No video selected to share.', true);
    }
  });
}

// YouTube button functionality
const downloadEmojiBtn = document.getElementById('downloadEmojiBtn');
downloadEmojiBtn.addEventListener('click', () => {
  if (currentVideoId) {
    const youtubeUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
    window.open(youtubeUrl, '_blank');
  } else {
    showStatusMessage('No video selected', true);
  }
});

// Load videos from localStorage, namespaced
const storedVideos = JSON.parse(localStorage.getItem(getCustomVideosKey())) || [];
const classListUl = document.getElementById('classList');
storedVideos.forEach(video => {
  const li = document.createElement('li');
  li.className = 'class-item';
  li.dataset.vid = video.id;
  li.dataset.nname = video.title;
  li.dataset.npdf = video.pdfLink || '';
  li.innerHTML = `
    <span class="class-title bengali-text">${video.title}</span>
    ${video.pdfLink ? `<i class="fas fa-file-pdf text-red-400"></i>` : ''}
  `;
  classListUl.appendChild(li);
});
attachClassItemListeners();

// Removed DOMContentLoaded auto-load; this now happens in onPlayerReady() with namespace!

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Only trigger if not focused on input elements
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

  const key = event.key.toLowerCase();
  switch (key) {
    case 'u': {
      // Volume up
      const currentVolume = youtubePlayer.getVolume();
      const newVolume = Math.min(100, currentVolume + 10);
      youtubePlayer.setVolume(newVolume);
      showStatusMessage(`Volume: ${newVolume}%`);
      break;
    }
    case 'd': {
      // Volume down
      const currentVolume = youtubePlayer.getVolume();
      const newVolume = Math.max(0, currentVolume - 10);
      youtubePlayer.setVolume(newVolume);
      showStatusMessage(`Volume: ${newVolume}%`);
      break;
    }
    case 'a': {
      // Slow down playback
      const currentRate = youtubePlayer.getPlaybackRate();
      const newRate = Math.max(0.25, currentRate - 0.25);
      youtubePlayer.setPlaybackRate(newRate);
      showStatusMessage(`Playback speed: ${newRate}x`);
      break;
    }
    case 'b': {
      // Speed up playback
      const currentRate = youtubePlayer.getPlaybackRate();
      const newRate = currentRate + 0.25;
      youtubePlayer.setPlaybackRate(newRate);
      showStatusMessage(`Playback speed: ${newRate}x`);
      break;
    }
    case 'f': {
      // Toggle fullscreen
      const iframe = document.querySelector('#player');
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        iframe.requestFullscreen();
      }
      break;
    }
    case ' ': {
      // Spacebar to play/pause
      event.preventDefault();
      if (youtubePlayer.getPlayerState() === 1) { // Playing
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
      break;
    }
  }
});

// Store time every 10 seconds (namespaced)
setInterval(() => {
  if (youtubePlayer && currentVideoId && youtubePlayer.getPlayerState() === 1) { // Playing
    const currentTime = youtubePlayer.getCurrentTime();
    const progressKey = getProgressKey(currentVideoId);
    localStorage.setItem(progressKey, currentTime);
    console.log(`Saved progress: ${currentTime.toFixed(2)}s for video ${currentVideoId}`);
  }
}, 10000);

// Show welcome message
window.addEventListener('load', () => {
  setTimeout(() => {
    showStatusMessage('Welcome to Bondi Pathshala! Select a class to begin.');
  }, 1000);
});
