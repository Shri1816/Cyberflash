/* ===========================
   CYBERFLASH — script.js
   Main Application Logic
   =========================== */

// ============================
// STATE & DATA
// ============================
let DATA = null;          // Loaded from questions.json
let currentDomain = null;
let currentLevel = null;
let currentCards = [];
let currentCardIndex = 0;
let isFlipped = false;

// Rapid Fire State
let rfQuestions = [];
let rfCurrent = 0;
let rfScore = 0;
let rfCorrect = 0;
let rfWrong = 0;
let rfSkipped = 0;
let rfTimer = null;
let rfTimePerQ = 20;
let rfTimeLeft = 20;
let rfAnswered = false;
let rfTotalQuestions = 20;

// Sound
let soundEnabled = true;

// Terminal animation
let terminalInterval = null;

// ============================
// LOADING
// ============================
const loaderMessages = [
  "Booting secure shell...",
  "Loading threat database...",
  "Encrypting session keys...",
  "Connecting to knowledge matrix...",
  "Calibrating neural firewall...",
  "Initializing CyberFlash..."
];

window.addEventListener('DOMContentLoaded', async () => {
  // Cycle loader status messages
  let li = 0;
  const loaderStatus = document.getElementById('loader-status');
  const loaderCycle = setInterval(() => {
    li = (li + 1) % loaderMessages.length;
    if (loaderStatus) loaderStatus.textContent = loaderMessages[li];
  }, 400);

  // Load data
  try {
    const res = await fetch('questions.json');
    DATA = await res.json();
  } catch (e) {
    console.error('Failed to load questions.json:', e);
    DATA = null;
  }

  // Minimum loading time for aesthetics
  await new Promise(r => setTimeout(r, 2000));
  clearInterval(loaderCycle);

  // Fade out loader
  const loader = document.getElementById('loading-screen');
  loader.classList.add('fade-out');
  setTimeout(() => { loader.style.display = 'none'; }, 700);

  // Init app
  initApp();
});

// ============================
// INIT
// ============================
function initApp() {
  initCanvas();
  initTheme();
  initSettings();
  startTerminalAnimation();
  showPage('hero');
}

// ============================
// PAGE ROUTING
// ============================
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });

  // Show target page
  const target = document.getElementById('page-' + pageId);
  if (!target) return;
  target.classList.remove('hidden');
  target.classList.add('active');

  // Show/hide nav and footer
  const nav = document.getElementById('top-nav');
  const footer = document.getElementById('site-footer');

  if (pageId === 'hero') {
    nav.classList.add('hidden');
    footer.classList.add('hidden');
    startTerminalAnimation();
  } else {
    nav.classList.remove('hidden');
    footer.classList.remove('hidden');
    // Update active nav
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === pageId);
    });
  }

  // Page-specific init
  if (pageId === 'domains') renderDomains();
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'achievements') renderAchievements();
  if (pageId === 'rapid-fire') initRapidFirePage();
  if (pageId === 'settings') initSettingsPage();

  // Scroll top
  window.scrollTo(0, 0);
}

// ============================
// HERO
// ============================
function startLearning() {
  stopTerminalAnimation();
  showPage('domains');
}

function startRapidFire() {
  stopTerminalAnimation();
  showPage('rapid-fire');
}

// Terminal typing animation on hero
const terminalLines = [
  { text: '> nmap -sV -O target.local', cls: 't-cmd' },
  { text: 'Starting Nmap scan...', cls: 't-out' },
  { text: 'PORT   STATE  SERVICE', cls: 't-out' },
  { text: '22/tcp open   ssh', cls: 't-out' },
  { text: '80/tcp open   http', cls: 't-out' },
  { text: '> hydra -l admin -P wordlist.txt ssh://target', cls: 't-cmd' },
  { text: '[WARNING] Brute force detected!', cls: 't-warn' },
  { text: '> sudo tcpdump -i eth0 port 443', cls: 't-cmd' },
  { text: 'Listening on eth0, capturing packets...', cls: 't-out' },
  { text: '> cat /etc/passwd | grep root', cls: 't-cmd' },
  { text: 'root:x:0:0:root:/root:/bin/bash', cls: 't-out' },
];

let termLine = 0;
let termChar = 0;
let termLineEl = null;

function startTerminalAnimation() {
  const body = document.getElementById('terminal-type');
  if (!body) return;
  body.innerHTML = '';
  termLine = 0;
  termChar = 0;
  typeNextChar();
}

function stopTerminalAnimation() {
  clearTimeout(terminalInterval);
}

function typeNextChar() {
  const body = document.getElementById('terminal-type');
  if (!body) return;

  if (termLine >= terminalLines.length) {
    // Restart
    setTimeout(() => {
      body.innerHTML = '';
      termLine = 0;
      termChar = 0;
      typeNextChar();
    }, 2000);
    return;
  }

  const line = terminalLines[termLine];

  if (termChar === 0) {
    // Remove cursor from previous
    const cursors = body.querySelectorAll('.t-cursor');
    cursors.forEach(c => c.remove());
    // Create new line
    termLineEl = document.createElement('div');
    termLineEl.className = line.cls;
    body.appendChild(termLineEl);
  }

  if (termChar < line.text.length) {
    const cursor = termLineEl.querySelector('.t-cursor');
    if (cursor) cursor.remove();
    termLineEl.textContent = line.text.slice(0, termChar + 1);
    const c = document.createElement('span');
    c.className = 't-cursor';
    termLineEl.appendChild(c);
    termChar++;
    terminalInterval = setTimeout(typeNextChar, 50 + Math.random() * 30);
  } else {
    // Line done
    termLine++;
    termChar = 0;
    terminalInterval = setTimeout(typeNextChar, 400);
  }
}

// ============================
// DOMAINS
// ============================
function renderDomains() {
  if (!DATA) return;
  const grid = document.getElementById('domains-grid');
  grid.innerHTML = '';

  DATA.domains.forEach(domain => {
    const progress = getDomainProgress(domain.id);
    const card = document.createElement('div');
    card.className = 'domain-card';
    card.innerHTML = `
      <span class="domain-icon">${domain.icon}</span>
      <div class="domain-name">${domain.name}</div>
      <div class="domain-desc">${domain.description}</div>
      <div class="domain-progress-wrap">
        <div class="domain-progress-label">
          <span>Progress</span>
          <span class="mono">${progress.done} / ${progress.total}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress.pct}%"></div>
        </div>
      </div>
      <button class="domain-start-btn" onclick="openDomain('${domain.id}')">
        ${progress.done > 0 ? '▶ Continue' : '→ Start Flashcards'}
      </button>
    `;
    grid.appendChild(card);
  });
}

function getDomainProgress(domainId) {
  const saved = loadProgress();
  let done = 0, total = 75; // 3 levels × 25 cards
  if (saved[domainId]) {
    ['basic', 'moderate', 'advanced'].forEach(lvl => {
      done += (saved[domainId][lvl] || 0);
    });
  }
  return { done, total, pct: Math.round((done / total) * 100) };
}

function openDomain(domainId) {
  currentDomain = DATA.domains.find(d => d.id === domainId);
  showPage('levels');
  renderLevels();
}

// ============================
// LEVELS
// ============================
function renderLevels() {
  if (!currentDomain) return;
  document.getElementById('levels-domain-name').textContent = `${currentDomain.icon} ${currentDomain.name}`;
  const grid = document.getElementById('levels-grid');
  grid.innerHTML = '';

  const saved = loadProgress();
  const domProgress = saved[currentDomain.id] || {};

  const levels = [
    { id: 'basic', name: 'Basic', badgeClass: 'badge-basic' },
    { id: 'moderate', name: 'Moderate', badgeClass: 'badge-moderate' },
    { id: 'advanced', name: 'Advanced', badgeClass: 'badge-advanced' },
  ];

  levels.forEach(lvl => {
    const completed = domProgress[lvl.id] || 0;
    const total = 25;
    const pct = Math.round((completed / total) * 100);
    const isDone = completed >= total;
    const isStarted = completed > 0;

    let btnClass = 'level-btn-start';
    let btnText = '→ Start Level';
    if (isStarted && !isDone) { btnClass = 'level-btn-resume'; btnText = '▶ Resume'; }
    if (isDone) { btnClass = 'level-btn-completed'; btnText = '✓ Completed'; }

    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `
      <span class="level-badge ${lvl.badgeClass}">${lvl.id.toUpperCase()}</span>
      <div class="level-name">${lvl.name}</div>
      <div class="level-count mono">25 flashcards</div>
      <div class="level-progress-label">
        <span>${completed} / ${total} completed</span>
        <span class="mono">${pct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      <button class="level-start-btn ${btnClass}" onclick="openLevel('${lvl.id}')">
        ${btnText}
      </button>
    `;
    grid.appendChild(card);
  });
}

function openLevel(levelId) {
  if (!currentDomain) return;
  currentLevel = levelId;
  currentCards = [...currentDomain.levels[levelId]];
  currentCardIndex = 0;
  isFlipped = false;

  // Load saved position
  const saved = loadProgress();
  const domProgress = saved[currentDomain.id] || {};
  const savedCard = domProgress[currentLevel + '_idx'] || 0;
  currentCardIndex = Math.min(savedCard, currentCards.length - 1);

  showPage('flashcard');
  renderFlashcard();

  // Set labels
  document.getElementById('fc-domain-label').textContent = currentDomain.name;
  const lvlBadge = document.getElementById('fc-level-label');
  lvlBadge.textContent = currentLevel.toUpperCase();
  lvlBadge.className = `level-badge badge-${currentLevel}`;
}

// ============================
// FLASHCARD
// ============================
function renderFlashcard() {
  if (!currentCards.length) return;
  const card = currentCards[currentCardIndex];

  document.getElementById('card-question').textContent = card.q;
  document.getElementById('card-answer').textContent = card.a;
  document.getElementById('fc-counter').textContent = `${currentCardIndex + 1} / ${currentCards.length}`;

  const pct = ((currentCardIndex + 1) / currentCards.length) * 100;
  document.getElementById('fc-progress-fill').style.width = pct + '%';

  // Reset flip
  isFlipped = false;
  document.getElementById('card-inner').classList.remove('flipped');

  // Disable prev on first card
  document.getElementById('btn-prev').disabled = currentCardIndex === 0;

  // Update progress
  updateLevelProgress(currentCardIndex + 1);
}

function flipCard() {
  isFlipped = !isFlipped;
  document.getElementById('card-inner').classList.toggle('flipped', isFlipped);
  playSound('flip');
}

function nextCard() {
  if (currentCardIndex < currentCards.length - 1) {
    currentCardIndex++;
    isFlipped = false;
    renderFlashcard();
    playSound('click');
  } else {
    // Level complete!
    completedLevel();
  }
}

function prevCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    isFlipped = false;
    renderFlashcard();
    playSound('click');
  }
}

function exitFlashcards() {
  saveCardProgress();
  showPage('levels');
}

function updateLevelProgress(cardNum) {
  const saved = loadProgress();
  if (!saved[currentDomain.id]) saved[currentDomain.id] = {};
  const existing = saved[currentDomain.id][currentLevel] || 0;
  saved[currentDomain.id][currentLevel] = Math.max(existing, cardNum);
  saved[currentDomain.id][currentLevel + '_idx'] = currentCardIndex;
  saveProgress(saved);
  checkAchievements();
}

function saveCardProgress() {
  const saved = loadProgress();
  if (!saved[currentDomain.id]) saved[currentDomain.id] = {};
  saved[currentDomain.id][currentLevel + '_idx'] = currentCardIndex;
  saveProgress(saved);
}

function completedLevel() {
  // Mark as 25
  const saved = loadProgress();
  if (!saved[currentDomain.id]) saved[currentDomain.id] = {};
  saved[currentDomain.id][currentLevel] = 25;
  saved[currentDomain.id][currentLevel + '_idx'] = 0;
  saveProgress(saved);
  checkAchievements();

  // Show complete page
  document.getElementById('complete-sub-text').textContent = `You've mastered all ${currentCards.length} cards in ${currentDomain.name} – ${capitalize(currentLevel)}`;
  document.getElementById('cs-cards').textContent = currentCards.length;
  document.getElementById('cs-domain').textContent = currentDomain.name;
  document.getElementById('cs-level').textContent = capitalize(currentLevel);

  showPage('fc-complete');
  playSound('success');
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const fcPage = document.getElementById('page-flashcard');
  if (!fcPage || fcPage.classList.contains('hidden')) return;

  if (e.key === 'ArrowRight' || e.key === 'l') nextCard();
  if (e.key === 'ArrowLeft' || e.key === 'h') prevCard();
  if (e.key === ' ' || e.key === 'f') { e.preventDefault(); flipCard(); }
});

// ============================
// RAPID FIRE MODE
// ============================
function initRapidFirePage() {
  document.getElementById('rf-timer-select').classList.remove('hidden');
  document.getElementById('rf-game').classList.add('hidden');
  document.getElementById('rf-results').classList.add('hidden');
}

function startRapidFireGame(seconds) {
  if (!DATA) return;
  rfTimePerQ = seconds;
  rfTotalQuestions = 20;
  rfScore = 0;
  rfCorrect = 0;
  rfWrong = 0;
  rfSkipped = 0;
  rfCurrent = 0;
  rfAnswered = false;

  // Gather all questions from all domains
  const pool = [];
  DATA.domains.forEach(domain => {
    ['basic', 'moderate', 'advanced'].forEach(level => {
      domain.levels[level].forEach(card => {
        pool.push({ q: card.q, a: card.a, domain: domain.name, icon: domain.icon });
      });
    });
  });

  // Shuffle and pick
  rfQuestions = shuffle(pool).slice(0, rfTotalQuestions);

  // Build 2 options per question
  rfQuestions = rfQuestions.map((item, i) => {
    const wrong = getWrongAnswer(pool, item.a);
    const options = shuffle([item.a, wrong]);
    return { ...item, options, correct: item.a };
  });

  document.getElementById('rf-timer-select').classList.add('hidden');
  document.getElementById('rf-game').classList.remove('hidden');
  document.getElementById('rf-results').classList.add('hidden');

  loadRFQuestion();
}

function loadRFQuestion() {
  if (rfCurrent >= rfTotalQuestions) {
    endRapidFire();
    return;
  }

  rfAnswered = false;
  const q = rfQuestions[rfCurrent];

  document.getElementById('rf-qcount').textContent = `${rfCurrent + 1} / ${rfTotalQuestions}`;
  document.getElementById('rf-domain-tag').textContent = `${q.icon} ${q.domain}`;
  document.getElementById('rf-question').textContent = q.q;

  const pct = (rfCurrent / rfTotalQuestions) * 100;
  document.getElementById('rf-progress-fill').style.width = pct + '%';

  // Render options
  const optDiv = document.getElementById('rf-options');
  optDiv.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'rf-option';
    btn.textContent = opt;
    btn.onclick = () => selectRFAnswer(opt, q.correct);
    optDiv.appendChild(btn);
  });

  // Update score
  document.getElementById('rf-score').textContent = rfScore;

  // Start timer
  clearInterval(rfTimer);
  rfTimeLeft = rfTimePerQ;
  updateTimerDisplay();
  rfTimer = setInterval(tickTimer, 1000);
}

function tickTimer() {
  rfTimeLeft--;
  updateTimerDisplay();
  if (rfTimeLeft <= 0) {
    clearInterval(rfTimer);
    if (!rfAnswered) {
      rfSkipped++;
      setTimeout(() => {
        rfCurrent++;
        loadRFQuestion();
      }, 500);
    }
  }
}

function updateTimerDisplay() {
  const num = document.getElementById('rf-timer-num');
  const circle = document.getElementById('timer-circle');
  num.textContent = rfTimeLeft;

  const circumference = 220;
  const offset = circumference - (rfTimeLeft / rfTimePerQ) * circumference;
  circle.style.strokeDashoffset = offset;

  const ratio = rfTimeLeft / rfTimePerQ;
  circle.className = 'timer-fill' + (ratio < 0.25 ? ' danger' : ratio < 0.5 ? ' warning' : '');
}

function selectRFAnswer(selected, correct) {
  if (rfAnswered) return;
  rfAnswered = true;
  clearInterval(rfTimer);

  const isCorrect = selected === correct;
  if (isCorrect) {
    rfScore += 10;
    rfCorrect++;
    playSound('correct');
  } else {
    rfScore = Math.max(0, rfScore - 5);
    rfWrong++;
    playSound('wrong');
  }

  // Highlight
  const buttons = document.querySelectorAll('.rf-option');
  buttons.forEach(btn => {
    btn.classList.add('answered');
    if (btn.textContent === correct) btn.classList.add('correct');
    if (btn.textContent === selected && !isCorrect) btn.classList.add('wrong');
    btn.style.cursor = 'default';
  });

  document.getElementById('rf-score').textContent = rfScore;

  setTimeout(() => {
    rfCurrent++;
    loadRFQuestion();
  }, 1200);
}

function endRapidFire() {
  clearInterval(rfTimer);

  const total = rfCorrect + rfWrong + rfSkipped;
  const acc = total > 0 ? Math.round((rfCorrect / total) * 100) : 0;

  // Results title and emoji
  let title = 'Keep Practicing!';
  let trophy = '🎯';
  if (acc >= 90) { title = 'Elite Hacker!'; trophy = '🏆'; }
  else if (acc >= 70) { title = 'Security Pro!'; trophy = '🥇'; }
  else if (acc >= 50) { title = 'Getting There!'; trophy = '🥈'; }

  document.getElementById('results-trophy').textContent = trophy;
  document.getElementById('results-title').textContent = title;
  document.getElementById('results-score-big').textContent = rfScore;
  document.getElementById('r-correct').textContent = rfCorrect;
  document.getElementById('r-wrong').textContent = rfWrong;
  document.getElementById('r-skipped').textContent = rfSkipped;
  document.getElementById('results-acc').textContent = `Accuracy: ${acc}%`;

  document.getElementById('rf-game').classList.add('hidden');
  document.getElementById('rf-results').classList.remove('hidden');

  // Save rapid fire high score
  const saved = loadProgress();
  if (!saved.rfHighScore || rfScore > saved.rfHighScore) {
    saved.rfHighScore = rfScore;
    saveProgress(saved);
  }

  checkAchievements();
  playSound('success');
}

function restartRapidFire() {
  initRapidFirePage();
}

function getWrongAnswer(pool, correctAnswer) {
  const filtered = pool.filter(p => p.a !== correctAnswer);
  return filtered[Math.floor(Math.random() * filtered.length)].a;
}

// ============================
// DASHBOARD
// ============================
function renderDashboard() {
  if (!DATA) return;
  const saved = loadProgress();
  const content = document.getElementById('dashboard-content');
  content.innerHTML = '';

  let totalCards = 0;
  let totalPossible = 0;
  let domainsCompleted = 0;
  let levelsCompleted = 0;

  const domainRows = DATA.domains.map(domain => {
    const dp = getDomainProgress(domain.id);
    totalCards += dp.done;
    totalPossible += dp.total;
    if (dp.done >= dp.total) domainsCompleted++;

    const domSaved = saved[domain.id] || {};
    ['basic', 'moderate', 'advanced'].forEach(lvl => {
      if ((domSaved[lvl] || 0) >= 25) levelsCompleted++;
    });

    return `
      <div class="dash-domain-row">
        <span class="dash-domain-icon">${domain.icon}</span>
        <span class="dash-domain-name">${domain.name}</span>
        <span class="dash-domain-pct mono">${dp.pct}%</span>
      </div>
      <div class="progress-bar" style="margin-bottom:14px">
        <div class="progress-fill" style="width:${dp.pct}%"></div>
      </div>
    `;
  }).join('');

  const overallPct = totalPossible > 0 ? Math.round((totalCards / totalPossible) * 100) : 0;
  const rfHigh = saved.rfHighScore || 0;

  const msgs = [
    "Every expert was once a beginner. Keep going! 🚀",
    "Your knowledge compounds daily. Stack it up! ⚡",
    "Persistence is the hallmark of every great hacker.",
    "The matrix is unraveling itself — one card at a time.",
    "Secure minds think alike. You're building yours.",
  ];
  const msg = msgs[Math.floor(totalCards / 20) % msgs.length] || msgs[0];

  content.innerHTML = `
    <div class="dash-card">
      <div class="dash-card-title">Total Cards Studied</div>
      <div class="dash-big-num">${totalCards}</div>
      <div class="dash-sub">of ${totalPossible} total cards</div>
    </div>
    <div class="dash-card">
      <div class="dash-card-title">Overall Progress</div>
      <div class="dash-big-num">${overallPct}%</div>
      <div class="progress-bar" style="margin-top:12px">
        <div class="progress-fill" style="width:${overallPct}%"></div>
      </div>
    </div>
    <div class="dash-card">
      <div class="dash-card-title">Levels Completed</div>
      <div class="dash-big-num">${levelsCompleted}</div>
      <div class="dash-sub">of 12 total levels</div>
    </div>
    <div class="dash-card">
      <div class="dash-card-title">Rapid Fire High Score</div>
      <div class="dash-big-num">${rfHigh}</div>
      <div class="dash-sub">points</div>
    </div>
    <div class="dash-card" style="grid-column: span 2">
      <div class="dash-card-title">Domain Breakdown</div>
      ${domainRows}
    </div>
    <div class="motivational">
      <p>${msg}</p>
    </div>
  `;
}

// ============================
// ACHIEVEMENTS
// ============================
const BADGES = [
  {
    id: 'beginner',
    name: 'Beginner Defender',
    icon: '🛡️',
    desc: 'Complete your first flashcard level',
    check: (progress) => {
      return Object.values(progress).some(d =>
        typeof d === 'object' && ['basic', 'moderate', 'advanced'].some(l => (d[l] || 0) >= 1)
      );
    }
  },
  {
    id: 'network_ninja',
    name: 'Network Ninja',
    icon: '🌐',
    desc: 'Complete all Network levels',
    check: (progress) => {
      const d = progress.networks || {};
      return (d.basic || 0) >= 25 && (d.moderate || 0) >= 25 && (d.advanced || 0) >= 25;
    }
  },
  {
    id: 'linux_explorer',
    name: 'Linux Explorer',
    icon: '🐧',
    desc: 'Complete all Linux levels',
    check: (progress) => {
      const d = progress.linux || {};
      return (d.basic || 0) >= 25 && (d.moderate || 0) >= 25 && (d.advanced || 0) >= 25;
    }
  },
  {
    id: 'soc_analyst',
    name: 'SOC Analyst',
    icon: '🔍',
    desc: 'Complete all SOC levels',
    check: (progress) => {
      const d = progress.soc || {};
      return (d.basic || 0) >= 25 && (d.moderate || 0) >= 25 && (d.advanced || 0) >= 25;
    }
  },
  {
    id: 'ethical_hacker',
    name: 'Ethical Hacker',
    icon: '⚡',
    desc: 'Complete all Ethical Hacking levels',
    check: (progress) => {
      const d = progress.hacking || {};
      return (d.basic || 0) >= 25 && (d.moderate || 0) >= 25 && (d.advanced || 0) >= 25;
    }
  },
  {
    id: 'flashcard_master',
    name: 'Flashcard Master',
    icon: '🏆',
    desc: 'Complete all 300 flashcards across all domains',
    check: (progress) => {
      const domains = ['networks', 'linux', 'soc', 'hacking'];
      return domains.every(domId => {
        const d = progress[domId] || {};
        return (d.basic || 0) >= 25 && (d.moderate || 0) >= 25 && (d.advanced || 0) >= 25;
      });
    }
  }
];

function checkAchievements() {
  const progress = loadProgress();
  const saved = progress.badges || [];
  const newBadges = [];

  BADGES.forEach(badge => {
    if (!saved.includes(badge.id) && badge.check(progress)) {
      saved.push(badge.id);
      newBadges.push(badge);
    }
  });

  if (newBadges.length > 0) {
    progress.badges = saved;
    saveProgress(progress);
    newBadges.forEach((badge, i) => {
      setTimeout(() => showBadgePopup(badge), i * 3000);
    });
  }
}

function showBadgePopup(badge) {
  const popup = document.getElementById('badge-popup');
  document.getElementById('badge-popup-icon').textContent = badge.icon;
  document.getElementById('badge-popup-name').textContent = badge.name;
  popup.classList.remove('hidden');
  playSound('badge');
  setTimeout(() => {
    popup.style.animation = 'slideIn 0.4s ease reverse';
    setTimeout(() => {
      popup.classList.add('hidden');
      popup.style.animation = '';
    }, 400);
  }, 3000);
}

function renderAchievements() {
  const progress = loadProgress();
  const unlockedBadges = progress.badges || [];
  const grid = document.getElementById('badges-grid');
  grid.innerHTML = '';

  BADGES.forEach(badge => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    const card = document.createElement('div');
    card.className = 'badge-card ' + (isUnlocked ? 'unlocked' : 'locked');
    card.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
      <div class="badge-status ${isUnlocked ? 'unlocked-text' : 'locked-text'}">
        ${isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
      </div>
    `;
    grid.appendChild(card);
  });
}

// ============================
// SETTINGS
// ============================
function initSettingsPage() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  document.getElementById('theme-toggle-settings').checked = isDark;
  document.getElementById('sound-toggle').checked = soundEnabled;
}

function toggleTheme(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-toggle-nav').textContent = isDark ? '🌙' : '☀️';
  const themeSet = document.getElementById('theme-toggle-settings');
  if (themeSet) themeSet.checked = isDark;
  localStorage.setItem('cf_theme', isDark ? 'dark' : 'light');
}

document.getElementById('theme-toggle-nav').addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  toggleTheme(!isDark);
});

function toggleSound(val) {
  soundEnabled = val;
  localStorage.setItem('cf_sound', val ? '1' : '0');
}

function resetProgress() {
  if (confirm('Are you sure? All your progress and achievements will be deleted.')) {
    localStorage.removeItem('cf_progress');
    alert('Progress has been reset!');
    initSettingsPage();
  }
}

function initTheme() {
  const saved = localStorage.getItem('cf_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle-nav').textContent = saved === 'dark' ? '🌙' : '☀️';
  soundEnabled = localStorage.getItem('cf_sound') !== '0';
}

// ============================
// MOBILE MENU
// ============================
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('hidden');
});

function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.add('hidden');
}

// ============================
// SOUNDS (Web Audio API)
// ============================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const configs = {
      click: { freq: 800, type: 'sine', duration: 0.08, vol: 0.06 },
      flip:  { freq: 440, type: 'sine', duration: 0.12, vol: 0.05 },
      correct: { freq: 660, type: 'sine', duration: 0.15, vol: 0.08 },
      wrong:   { freq: 220, type: 'sawtooth', duration: 0.2, vol: 0.06 },
      success: { freq: 880, type: 'sine', duration: 0.3, vol: 0.08 },
      badge:   { freq: 1000, type: 'sine', duration: 0.4, vol: 0.08 },
    };

    const c = configs[type] || configs.click;
    osc.type = c.type;
    osc.frequency.value = c.freq;
    gain.gain.setValueAtTime(c.vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + c.duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + c.duration);
  } catch(e) {}
}

// ============================
// LOCALSTORAGE PROGRESS
// ============================
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem('cf_progress')) || {};
  } catch(e) { return {}; }
}

function saveProgress(data) {
  localStorage.setItem('cf_progress', JSON.stringify(data));
}

// ============================
// CANVAS BACKGROUND
// ============================
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create particles
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#00c8ff' : '#7c3aed',
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });

    // Draw connections
    ctx.globalAlpha = 1;
    particles.forEach((p, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#00c8ff';
          ctx.globalAlpha = (1 - dist / 100) * 0.15;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });

    ctx.globalAlpha = 1;
  }

  function moveParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
  }

  function loop() {
    moveParticles();
    drawParticles();
    animFrame = requestAnimationFrame(loop);
  }
  loop();
}

// ============================
// UTILITIES
// ============================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function initSettings() {
  // already handled by initTheme
}
