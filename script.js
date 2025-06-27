const player = new Plyr('#player', {
  controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'settings', 'pip', 'fullscreen'],
  youtube: { noCookie: true, rel: 0, showinfo: 0, modestbranding: 1 },
  settings: ['quality', 'speed'],
  speed: { selected: 1, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] }
});

const container = player.elements.container;

// Create skip buttons
const skipLeft = document.createElement('button');
const skipRight = document.createElement('button');

// Set icons (replace with your image URLs)
skipLeft.innerHTML = `<img src="https://cdn-icons-png.freepik.com/512/4553/4553697.png" alt="Back" style="width:28px;height:28px;">`;
skipRight.innerHTML = `<img src="https://cdn-icons-png.freepik.com/512/4553/4553697.png" alt="Forward" style="width:28px;height:28px;">`;

// Common style
const styleSkipButton = (btn, position) => {
  Object.assign(btn.style, {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#3a3a3a',
    border: 'none',
    borderRadius: '50%',
    padding: '16px',
    zIndex: 12,
    opacity: 0,
    transition: 'opacity 0.3s',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  btn.style.left = position;
};

// Position buttons near center
styleSkipButton(skipLeft, 'calc(50% - 120px)');
styleSkipButton(skipRight, 'calc(50% + 60px)');

// Append to player
container.style.position = 'relative';
container.appendChild(skipLeft);
container.appendChild(skipRight);

// Click actions
skipLeft.addEventListener('click', () => {
  player.currentTime = Math.max(0, player.currentTime - 10);
  showToast('⏪ 10s');
});
skipRight.addEventListener('click', () => {
  player.currentTime = Math.min(player.duration, player.currentTime + 10);
  showToast('⏩ 10s');
});

// Show/hide on interaction or pause
function showSkipButtons() {
  skipLeft.style.opacity = '1';
  skipRight.style.opacity = '1';
  skipLeft.style.pointerEvents = 'auto';
  skipRight.style.pointerEvents = 'auto';
  clearTimeout(skipLeft._timeout);
  skipLeft._timeout = setTimeout(hideSkipButtons, 700);
}
function hideSkipButtons() {
  skipLeft.style.opacity = '0';
  skipRight.style.opacity = '0';
  skipLeft.style.pointerEvents = 'none';
  skipRight.style.pointerEvents = 'none';
}

['mousemove', 'touchstart'].forEach(evt =>
  container.addEventListener(evt, showSkipButtons)
);
player.on('pause', showSkipButtons);
player.on('play', hideSkipButtons);

function setHighestQuality() {
  const availableQualities = player.quality?.options;
  if (availableQualities && availableQualities.length > 0) {
    const sorted = availableQualities.filter(q => q !== 'auto').sort((a, b) => parseInt(b) - parseInt(a));
    if (sorted.length > 0) {
      player.quality = sorted[0];
      console.log(`Set highest quality: ${sorted[0]}`);
    }
  }
}

function attachClassItemListeners() {
  const classItems = document.querySelectorAll('.class-item');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  classItems.forEach(item => {
    if (item._eventListener) item.removeEventListener('click', item._eventListener);
  });

  classItems.forEach(item => {
    const listener = () => {
      const videoId = item.dataset.vid;
      currentVideoId = videoId;
      localStorage.setItem('lastSelectedVideo', videoId);

      player.source = {
        type: 'video',
        sources: [{ src: videoId, provider: 'youtube' }]
      };

      const customShareBtn = document.getElementById('customShareBtn');
      if (customShareBtn) {
        customShareBtn.addEventListener('click', () => {
          if (currentVideoId) {
            const url = `https://www.youtube.com/watch?v=${currentVideoId}`;
            navigator.clipboard.writeText(url).then(() => alert('Video link copied!'))
              .catch(() => alert('Copy failed.'));
          } else alert("No video selected.");
        });
      }

      classItems.forEach(i => i.classList.remove('bg-blue-200'));
      item.classList.add('bg-blue-200');

      const pdfLink = item.dataset.npdf;
      if (pdfLink) {
        downloadPdfBtn.href = `https://www.bondipathshala.com.bd/pdf/${pdfLink}`;
        downloadPdfBtn.classList.remove('hidden');
      } else {
        downloadPdfBtn.classList.add('hidden');
      }
    };
    item.addEventListener('click', listener);
    item._eventListener = listener;
  });
}

attachClassItemListeners();

// Load stored videos
const storedVideos = JSON.parse(localStorage.getItem('customVideos')) || [];
const classListUl = document.getElementById('classList');
storedVideos.forEach(video => {
  const li = document.createElement('li');
  li.className = 'class-item p-2 rounded hover:bg-blue-100 cursor-pointer';
  li.dataset.vid = video.id;
  li.dataset.nname = video.title;
  li.dataset.npdf = video.pdfLink || '';
  li.innerHTML = `${video.title}${video.pdfLink ? ` <i class="fas fa-file-pdf text-red-500 ml-2"></i>` : ''}`;
  classListUl.appendChild(li);
});
attachClassItemListeners();

// Resume last watched
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const lastVideoId = localStorage.getItem('lastSelectedVideo');
    if (lastVideoId) {
      const lastItem = [...document.querySelectorAll('.class-item')].find(i => i.dataset.vid === lastVideoId);
      if (lastItem) {
        lastItem.click();
        lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 3500);
});

function showToast(message) {
  const toast = document.getElementById('playerToast');
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.style.opacity = '0';
  }, 1500);
}

// Download button
const downloadEmojiBtn = document.getElementById('downloadEmojiBtn');
if (downloadEmojiBtn) {
  downloadEmojiBtn.addEventListener('click', () => {
    if (currentVideoId) {
      window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
    } else {
      alert("No video selected");
    }
  });
}

// Global keyboard shortcuts like YouTube
window.addEventListener('keydown', event => {
  const tag = event.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || event.target.isContentEditable) return;

  const key = event.key.toLowerCase();
  switch (key) {
    case 'k':
    case ' ':
      event.preventDefault();
      player.togglePlay();
      showToast(player.playing ? 'Playing' : 'Paused');
      break;

    case 'arrowup':
      event.preventDefault();
      player.volume = Math.min(1, player.volume + 0.1);
      showToast(`Volume: ${(player.volume * 100).toFixed(0)}%`);
      break;

    case 'arrowdown':
      event.preventDefault();
      player.volume = Math.max(0, player.volume - 0.1);
      showToast(`Volume: ${(player.volume * 100).toFixed(0)}%`);
      break;

    case ',':
      {
        const current = player.speed;
        const options = player.config.speed.options;
        const index = options.indexOf(current);
        if (index > 0) {
          player.speed = options[index - 1];
          showToast(`Speed: ${player.speed.toFixed(2)}x`);
        }
      }
      break;

    case '.':
      {
        const current = player.speed;
        const options = player.config.speed.options;
        const index = options.indexOf(current);
        if (index < options.length - 1) {
          player.speed = options[index + 1];
          showToast(`Speed: ${player.speed.toFixed(2)}x`);
        }
      }
      break;

    case 'arrowleft':
      player.currentTime = Math.max(0, player.currentTime - 5);
      showToast(`⏪ -5s`);
      break;

    case 'arrowright':
      player.currentTime = Math.min(player.duration, player.currentTime + 5);
      showToast(`⏩ +5s`);
      break;

    case 'j':
      player.currentTime = Math.max(0, player.currentTime - 10);
      showToast(`⏪ -10s`);
      break;

    case 'l':
      player.currentTime = Math.min(player.duration, player.currentTime + 10);
      showToast(`⏩ +10s`);
      break;

    case 'f':
      event.preventDefault();
      player.fullscreen.toggle();
      showToast(player.fullscreen.active ? 'Fullscreen' : 'Windowed');
      break;
  }
});

// Save time every 10s
setInterval(() => {
  if (player && currentVideoId && !player.paused) {
    const progressKey = `videoProgress_${currentVideoId}`;
    localStorage.setItem(progressKey, player.currentTime);
  }
}, 10000);

// Resume time when ready
player.on('ready', () => {
  setHighestQuality();
  if (currentVideoId) {
    const progressKey = `videoProgress_${currentVideoId}`;
    const savedTime = parseFloat(localStorage.getItem(progressKey));
    if (!isNaN(savedTime)) {
      player.currentTime = savedTime;
    }
  }
});

player.on('sourcechange', () => {
  setTimeout(() => {
    setHighestQuality();
    if (currentVideoId) {
      const progressKey = `videoProgress_${currentVideoId}`;
      const savedTime = parseFloat(localStorage.getItem(progressKey));
      if (!isNaN(savedTime)) {
        player.currentTime = savedTime;
      }
    }
  }, 500);
});

// Create help button
const helpBtn = document.createElement('button');
helpBtn.id = 'helpBtn';
helpBtn.textContent = '?';
Object.assign(helpBtn.style, {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#1e40af', // blue-800 dark
  color: 'white',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
  zIndex: '99999',
});
document.body.appendChild(helpBtn);

// Create help popup
const helpPopup = document.createElement('div');
helpPopup.id = 'helpPopup';
Object.assign(helpPopup.style, {
  display: 'none',
  position: 'fixed',
  bottom: '75px',
  right: '20px',
  width: '300px',
  backgroundColor: '#111827', // gray-900 dark
  color: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
  padding: '16px 20px',
  fontSize: '14px',
  lineHeight: '1.5',
  zIndex: '99999',
  userSelect: 'none',
  fontFamily: 'Arial, sans-serif',
});
helpPopup.innerHTML = `
  <strong style="font-size:16px;display:block;margin-bottom:10px;">Keyboard Shortcuts</strong>
  <ul style="padding-left: 18px; margin: 0;">
    <li><b>K / Space</b>: Play / Pause</li>
    <li><b>J / ←</b>: Rewind 10s / 5s</li>
    <li><b>L / →</b>: Forward 10s / 5s</li>
    <li><b>↑ / ↓</b>: Volume up / down</li>
    <li><b>M</b>: Mute / Unmute</li>
    <li><b>F</b>: Fullscreen toggle</li>
    <li><b>, / .</b>: Speed down / up</li>
    <li><b>?</b>: Toggle this help</li>
  </ul>
`;
document.body.appendChild(helpPopup);

// Toggle function
function toggleHelp() {
  helpPopup.style.display = helpPopup.style.display === 'block' ? 'none' : 'block';
}

// Button click toggles popup
helpBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleHelp();
});

// Click outside closes popup
document.addEventListener('click', (e) => {
  if (!helpBtn.contains(e.target) && !helpPopup.contains(e.target)) {
    helpPopup.style.display = 'none';
  }
});

// Press ? key toggles popup
document.addEventListener('keydown', (e) => {
  if (e.key === '?') {
    toggleHelp();
  }
});

const playerElement = document.getElementById('player'); // your Plyr container

let lastTapTime = 0;
let lastTapX = 0;

playerElement.addEventListener('touchend', (e) => {
  const currentTime = Date.now();
  const tapX = e.changedTouches[0].clientX;

  // Check for double tap within 300ms and close horizontal position (100px)
  if (currentTime - lastTapTime < 300 && Math.abs(tapX - lastTapX) < 100) {
    const width = playerElement.clientWidth;
    const tapSide = tapX < width / 2 ? 'left' : 'right';

    if (tapSide === 'left') {
      player.currentTime = Math.max(0, player.currentTime - 10);
      showToast('⏪ 10s');
    } else {
      player.currentTime = Math.min(player.duration, player.currentTime + 10);
      showToast('⏩ 10s');
    }
    lastTapTime = 0; // reset to avoid triple tap
  } else {
    lastTapTime = currentTime;
    lastTapX = tapX;
  }
});

// Optional: desktop double click support
playerElement.addEventListener('dblclick', (e) => {
  const rect = playerElement.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = playerElement.clientWidth;

  if (clickX < width / 2) {
    player.currentTime = Math.max(0, player.currentTime - 10);
    showToast('⏪ 10s');
  } else {
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
    showToast('⏩ 10s');
  }
});
