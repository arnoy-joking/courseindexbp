// --- Per-page namespace extraction from file name ---
const PAGE_NAMESPACE = (() => {
  const path = window.location.pathname;
  const matches = path.match(/([^\/]+)\.html?$/i);
  return (matches && matches[1]) ? matches[1] : 'default';
})();

function getProgressKey(videoId) {
  return `${PAGE_NAMESPACE}_videoProgress_${videoId}`;
}
function getLastSelectedKey() {
  return `${PAGE_NAMESPACE}_lastSelectedVideo`;
}
function getCustomVideosKey() {
  return `${PAGE_NAMESPACE}_customVideos`;
}

let currentVideoId = 'RUQcm3vIbWo'; // fallback video
let youtubePlayer;
let playerReady = false;

// Toast/status message
function showStatusMessage(message, isError = false) {
  let statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.style.background = isError ? '#e53e3e' : '#38b2ac';
  statusEl.style.opacity = '1';
  statusEl.classList.add('show');
  clearTimeout(statusEl._hideTimeout);
  statusEl._hideTimeout = setTimeout(() => {
    statusEl.style.opacity = '0';
    statusEl.classList.remove('show');
  }, 1800);
}

// YouTube Iframe API - Embed player on div#player
window.onYouTubeIframeAPIReady = function() {
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
};

function onPlayerReady(event) {
  playerReady = true;
  showStatusMessage('Player is ready. Select a class to start learning!');
  setTimeout(() => {
    const lastVideoId = localStorage.getItem(getLastSelectedKey());
    if (lastVideoId && lastVideoId !== currentVideoId) {
      const lastItem = [...document.querySelectorAll('.class-item')].find(item => item.dataset.vid === lastVideoId);
      if (lastItem) {
        lastItem.click();
        lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        changeVideo(lastVideoId);
      }
    } else if (!lastVideoId) {
      const firstItem = document.querySelector('.class-item');
      if (firstItem) firstItem.click();
    }
  }, 2500);
}

function changeVideo(videoId, attempt=0) {
  if (youtubePlayer && youtubePlayer.loadVideoById) {
    try {
      youtubePlayer.loadVideoById(videoId);
      currentVideoId = videoId;
      showStatusMessage("Video loaded");

      setTimeout(() => {
        const progressKey = getProgressKey(videoId);
        const savedTime = parseFloat(localStorage.getItem(progressKey));
        if (!isNaN(savedTime) && savedTime > 0) {
          youtubePlayer.seekTo(savedTime, true);
          showStatusMessage(`Resumed at ${savedTime.toFixed(1)}s`);
        }
      }, 600);

    } catch (e) {
      if (attempt < 3) setTimeout(() => changeVideo(videoId, attempt + 1), 600);
      else showStatusMessage("Failed to load video", true);
    }
  } else {
    if (attempt < 6) setTimeout(() => changeVideo(videoId, attempt + 1), 400);
    else showStatusMessage("Player not ready", true);
  }
}

function onPlayerStateChange(event) {
  // You can extend with custom UI feedback here if you want
}

// Attach listeners to class items for list
function attachClassItemListeners() {
  const classItems = document.querySelectorAll('.class-item');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  classItems.forEach(item => {
    if (item._eventListener) item.removeEventListener('click', item._eventListener);
  });

  classItems.forEach(item => {
    const listener = () => {
      const videoId = item.dataset.vid;
      const className = item.dataset.nname;
      currentVideoId = videoId;
      localStorage.setItem(getLastSelectedKey(), videoId);

      changeVideo(videoId);

      classItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const pdfLink = item.dataset.npdf;
      if (downloadPdfBtn) {
        if (pdfLink) {
          downloadPdfBtn.href = `https://www.bondipathshala.com.bd/pdf/${pdfLink}`;
          downloadPdfBtn.classList.remove('hidden');
        } else {
          downloadPdfBtn.classList.add('hidden');
        }
      }

      showStatusMessage(`Now playing: ${className}`);
    };
    item.addEventListener('click', listener);
    item._eventListener = listener;
  });
}
attachClassItemListeners();

// Share button
const customShareBtn = document.getElementById('customShareBtn');
if (customShareBtn) {
  customShareBtn.onclick = () => {
    if (currentVideoId) {
      const url = `https://www.youtube.com/watch?v=${currentVideoId}`;
      navigator.clipboard.writeText(url)
        .then(() => showStatusMessage('Video link copied!'))
        .catch(() => showStatusMessage('Copy failed.', true));
    } else showStatusMessage('No video selected.', true);
  };
}

// Download YouTube button
const downloadEmojiBtn = document.getElementById('downloadEmojiBtn');
if (downloadEmojiBtn) {
  downloadEmojiBtn.addEventListener('click', () => {
    if (currentVideoId) {
      window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
    } else {
      showStatusMessage("No video selected", true);
    }
  });
}

window.addEventListener('load', () => {
  setTimeout(() => {
    showStatusMessage('Welcome to Bondi Pathshala! Select a class to begin.');
  }, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA'
      || event.target.isContentEditable) return;

  if (!playerReady || !youtubePlayer) return;

  const key = event.key.toLowerCase();
  try {
    switch (key) {
      case 'u': {
        const currentVolume = youtubePlayer.getVolume();
        const newVolume = Math.min(100, currentVolume + 10);
        youtubePlayer.setVolume(newVolume);
        showStatusMessage(`Volume: ${newVolume}%`);
        break;
      }
      case 'd': {
        const currentVolume = youtubePlayer.getVolume();
        const newVolume = Math.max(0, currentVolume - 10);
        youtubePlayer.setVolume(newVolume);
        showStatusMessage(`Volume: ${newVolume}%`);
        break;
      }
      case 'a': {
        const currentRate = youtubePlayer.getPlaybackRate();
        const newRate = Math.max(0.25, currentRate - 0.25);
        youtubePlayer.setPlaybackRate(newRate);
        showStatusMessage(`Playback speed: ${newRate}x`);
        break;
      }
      case 'b': {
        const currentRate = youtubePlayer.getPlaybackRate();
        const newRate = currentRate + 0.25;
        youtubePlayer.setPlaybackRate(newRate);
        showStatusMessage(`Playback speed: ${newRate}x`);
        break;
      }
      case 'f': {
        const iframe = document.getElementById('player');
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          if (iframe.requestFullscreen) iframe.requestFullscreen();
        }
        break;
      }
      case ' ':
        event.preventDefault();
        if (youtubePlayer.getPlayerState() === 1) youtubePlayer.pauseVideo();
        else youtubePlayer.playVideo();
        break;
      case 'j':
        youtubePlayer.seekTo(Math.max(0, youtubePlayer.getCurrentTime() - 10), true);
        showStatusMessage('⏪ -10s');
        break;
      case 'l':
        youtubePlayer.seekTo(youtubePlayer.getCurrentTime() + 10, true);
        showStatusMessage('⏩ +10s');
        break;
      case 'arrowleft':
        youtubePlayer.seekTo(Math.max(0, youtubePlayer.getCurrentTime() - 5), true);
        showStatusMessage('⏪ -5s');
        break;
      case 'arrowright':
        youtubePlayer.seekTo(youtubePlayer.getCurrentTime() + 5, true);
        showStatusMessage('⏩ +5s');
        break;
    }
  } catch (e) { }
});

// Save progress periodically
setInterval(() => {
  if (youtubePlayer && currentVideoId && playerReady && youtubePlayer.getPlayerState() === 1) {
    const currentTime = youtubePlayer.getCurrentTime();
    localStorage.setItem(getProgressKey(currentVideoId), currentTime);
  }
}, 10000);
