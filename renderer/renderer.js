/* ============================================================
   YourTeacher - Renderer Process Logic
   Vanilla JS: routing, state, quizzes, games, speech, writing lab
   ============================================================ */

// ============================================================
// STATE
// ============================================================
const State = {
  user: null,
  users: [],
  levels: [],
  currentLevel: 'A1',
  currentUnit: null,
  currentLesson: null,
  progress: [],
  route: 'dashboard',
  dark: localStorage.getItem('yt-theme') === 'dark',
};

const LEVELS_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
const UNLOCK_SCORE = 70;
const XP_PER_LESSON = 20;
const XP_PER_QUIZ_BASE = 30;

// ============================================================
// UTILS
// ============================================================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 2600);
}

function showModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modalOverlay').classList.add('show');
}
function hideModal() { $('#modalOverlay').classList.remove('show'); }
$('#modalOverlay').addEventListener('click', (e) => {
  if (e.target === $('#modalOverlay')) hideModal();
});

function applyTheme() {
  document.documentElement.setAttribute('data-theme', State.dark ? 'dark' : 'light');
  $('#themeToggle').textContent = State.dark ? '☀️' : '🌙';
  localStorage.setItem('yt-theme', State.dark ? 'dark' : 'light');
}

function unitProgress(unitId) {
  const p = State.progress.filter((x) => x.unit_id === unitId);
  const doneLessons = p.filter((x) => x.lesson_completed).length;
  const quiz = p.find((x) => x.quiz_score !== null);
  return {
    doneLessons,
    quizScore: quiz ? quiz.quiz_score : null,
    percent: Math.round(((doneLessons + (quiz ? 1 : 0)) / 4) * 100),
    completed: quiz ? quiz.quiz_score >= UNLOCK_SCORE : false,
  };
}

function unitUnlocked(unit, idx, units) {
  if (idx === 0) return true;
  const prev = units[idx - 1];
  const prevProg = unitProgress(prev.id);
  return prevProg.quizScore !== null && prevProg.quizScore >= UNLOCK_SCORE;
}

async function levelProgress(levelCode) {
  const units = await window.electron.getUnits(levelCode);
  let total = 0, earned = 0;
  for (const u of units) {
    total += 4;
    const p = unitProgress(u.id);
    earned += p.doneLessons + (p.quizScore !== null ? 1 : 0);
  }
  return Math.round((earned / total) * 100);
}

async function updateUserStreak() {
  if (!State.user) return;
  const today = new Date().toDateString();
  const last = localStorage.getItem('yt-last-active');
  let streak = State.user.streak_days || 0;
  if (last !== today) {
    streak = (last === new Date(Date.now() - 86400000).toDateString()) ? streak + 1 : 1;
    localStorage.setItem('yt-last-active', today);
    State.user.streak_days = streak;
    await window.electron.updateUser(State.user);
  }
}

function refreshHeader() {
  if (!State.user) {
    $('#headerStats').style.display = 'none';
    $('#userMenu').style.display = 'none';
    $('#sidebar').style.display = 'none';
    return;
  }
  $('#headerStats').style.display = 'flex';
  $('#userMenu').style.display = 'flex';
  $('#sidebar').style.display = 'flex';
  $('#hdrXp').textContent = `${State.user.total_xp} XP`;
  $('#hdrStreak').textContent = `${State.user.streak_days} day streak`;
  $('#hdrLevel').textContent = State.user.level;
  $('#hdrName').textContent = State.user.name;
  $('#hdrAvatar').textContent = (State.user.name || '?')[0].toUpperCase();
}

// ============================================================
// ROUTER
// ============================================================
function navigate(route, params = {}) {
  State.route = route;
  State.params = params;
  $$('.nav-item[data-route]').forEach((n) => {
    n.classList.toggle('active', n.dataset.route === route ||
      ((route === 'unit' || route === 'lesson' || route === 'quiz' || route === 'games' || route === 'flipcards' || route === 'sentencebuilder') && n.dataset.route === 'learn'));
  });
  render();
  $('#content').scrollTop = 0;
}

$$('.nav-item[data-route]').forEach((n) => {
  n.addEventListener('click', () => navigate(n.dataset.route));
});
$('#themeToggle').addEventListener('click', () => {
  State.dark = !State.dark;
  applyTheme();
});

// ============================================================
// ONBOARDING
// ============================================================
let obSelected = 'A1';

async function initOnboarding() {
  const levels = await window.electron.getLevels();
  State.levels = levels;
  const users = await window.electron.getUsers();
  State.users = users;

  const cont = $('#obLevels');
  cont.innerHTML = levels.map((l) => `
    <div class="level-option ${l.code === obSelected ? 'selected' : ''}" data-code="${l.code}">
      <div class="code">${l.code}</div>
      <div class="lbl">${l.title}</div>
    </div>
  `).join('');
  cont.querySelectorAll('.level-option').forEach((el) => {
    el.addEventListener('click', () => {
      obSelected = el.dataset.code;
      cont.querySelectorAll('.level-option').forEach((o) => o.classList.toggle('selected', o.dataset.code === obSelected));
    });
  });

  $('#obStart').addEventListener('click', async () => {
    const name = $('#obName').value.trim();
    if (!name) { toast('Please enter your name'); return; }
    await window.electron.createUser({ name, level: obSelected });
    const fresh = await window.electron.getUsers();
    State.user = fresh[fresh.length - 1];
    localStorage.setItem('yt-user', State.user.id);
    $('#onboardingOverlay').classList.remove('show');
    await postLogin();
  });

  if (users.length > 0) {
    const savedId = localStorage.getItem('yt-user');
    const target = users.find((u) => String(u.id) === String(savedId)) || users[users.length - 1];
    State.user = target;
    $('#onboardingOverlay').classList.remove('show');
    await postLogin();
  } else {
    $('#onboardingOverlay').classList.add('show');
  }
}

async function postLogin() {
  State.progress = await window.electron.getProgress(State.user.id);
  await updateUserStreak();
  refreshHeader();
  navigate('dashboard');
}

$('#navSwitch').addEventListener('click', async () => {
  const users = await window.electron.getUsers();
  showModal(`
    <h3>Switch User</h3>
    <p class="text-muted" style="margin-bottom:12px;">Choose a profile or create a new one.</p>
    ${users.map((u) => `
      <div class="vocab-item" data-uid="${u.id}" style="margin-bottom:8px;">
        <span class="w">${esc(u.name)}</span>
        <span style="color:var(--text-muted);font-size:12px;margin-left:8px;">${u.level} · ${u.total_xp} XP · ${u.streak_days}🔥</span>
      </div>
    `).join('')}
    <div class="modal-actions">
      <button class="btn btn-ghost" id="obNewUser">+ New Profile</button>
    </div>
  `);
  $$('#modalBody .vocab-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const u = users.find((x) => String(x.id) === el.dataset.uid);
      State.user = u;
      localStorage.setItem('yt-user', u.id);
      hideModal();
      await postLogin();
    });
  });
  $('#obNewUser').addEventListener('click', () => {
    hideModal();
    State.user = null;
    localStorage.removeItem('yt-user');
    $('#onboardingOverlay').classList.add('show');
  });
});

$('#navExport').addEventListener('click', async () => {
  if (!State.user) return;
  const res = await window.electron.exportProgressReport({ userId: State.user.id });
  toast(res.success ? `Report saved: ${res.filePath}` : 'Export cancelled');
});

// ============================================================
// RENDER DISPATCHER
// ============================================================
async function render() {
  const c = $('#content');
  if (!State.user) { c.innerHTML = ''; return; }
  switch (State.route) {
    case 'dashboard': return renderDashboard(c);
    case 'learn': return renderLearn(c);
    case 'unit': return renderUnit(c, State.params.unit);
    case 'lesson': return renderLesson(c, State.params.lesson);
    case 'quiz': return renderQuiz(c, State.params.unitId);
    case 'games': return renderGames(c, State.params.unitId);
    case 'flipcards': return renderFlipCards(c, State.params.unitId);
    case 'sentencebuilder': return renderSentenceBuilder(c, State.params.unitId);
    case 'writing': return renderWriting(c);
    case 'listening': return renderListening(c, State.params.unitId);
    case 'speaking': return renderSpeaking(c, State.params.unitId);
    case 'progress': return renderProgress(c);
    default: renderDashboard(c);
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard(c) {
  const levels = await window.electron.getLevels();
  const units = await window.electron.getUnits(State.user.level);
  const pct = await levelProgress(State.user.level);
  const level = levels.find((l) => l.code === State.user.level);

  const r = 68, circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  const lockedIdx = units.findIndex((u, i) => !unitUnlocked(u, i, units));
  const nextLocked = lockedIdx === -1 ? null : units[lockedIdx];

  c.innerHTML = `
    <h2 class="section-title">Dashboard</h2>
    <div class="dash-hero">
      <div class="card progress-card">
        <h3>Level ${State.user.level} Progress</h3>
        <div class="circular-wrap">
          <div class="circular">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r="${r}" stroke="var(--border)" stroke-width="12" fill="none"/>
              <circle cx="80" cy="80" r="${r}" stroke="url(#grad)" stroke-width="12" fill="none"
                      stroke-dasharray="${circ}" stroke-dashoffset="${dash}" stroke-linecap="round"/>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#58cc02"/>
                  <stop offset="100%" stop-color="#1cb0f6"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="pct">${pct}%</div>
          </div>
          <div class="dash-info">
            <h2>Keep it up, ${esc(State.user.name.split(' ')[0])}!</h2>
            <p class="sub">You're learning at level ${State.user.level} — ${level.title}.</p>
            <div class="stat-row">
              <div class="mini-stat"><div class="val">⚡ ${State.user.total_xp}</div><div class="lbl">Total XP</div></div>
              <div class="mini-stat"><div class="val">🔥 ${State.user.streak_days}</div><div class="lbl">Day Streak</div></div>
              <div class="mini-stat"><div class="val">✅ ${State.progress.filter((p) => p.lesson_completed).length}</div><div class="lbl">Lessons Done</div></div>
            </div>
            ${nextLocked
              ? `<div class="mt-16" style="font-size:14px;color:var(--text-muted);">🔓 Next: <b>${esc(nextLocked.theme)}</b> — score above 70% on the previous quiz to unlock.</div>`
              : `<div class="mt-16" style="font-size:14px;color:var(--primary-dark);font-weight:700;">🎉 All units in this level completed!</div>`}
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Today's Skills</h3>
        <p class="text-muted" style="font-size:14px;margin-bottom:14px;">Practice all four skills to level up faster.</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-ghost" style="justify-content:flex-start;" onclick="__nav('learn')">📖 Continue a lesson</button>
          <button class="btn btn-ghost" style="justify-content:flex-start;" onclick="__nav('writing')">✍️ Writing Lab</button>
          <button class="btn btn-ghost" style="justify-content:flex-start;" onclick="__nav('listening')">🎧 Listening practice</button>
          <button class="btn btn-ghost" style="justify-content:flex-start;" onclick="__nav('speaking')">🎤 Speaking practice</button>
        </div>
      </div>
    </div>

    <h3 style="margin-bottom:14px;">Units — ${State.user.level} ${level.title}</h3>
    <div class="unit-timeline" id="dashTimeline">
      ${units.map((u, i) => {
        const unlocked = unitUnlocked(u, i, units);
        const prog = unitProgress(u.id);
        return `
          <div class="unit-card ${unlocked ? '' : 'locked'} ${prog.completed ? 'completed' : ''}" ${unlocked ? `data-uid="${u.id}"` : ''}>
            <div class="u-num">${u.unit_number}</div>
            <div class="u-theme">${esc(u.theme)}</div>
            <div class="u-grammar">${esc(u.grammar_focus)}</div>
            <div class="u-progress">${prog.percent}% complete${prog.quizScore !== null ? ` · quiz ${prog.quizScore}%` : ''}</div>
            <div class="u-bar"><div class="u-bar-fill" style="width:${prog.percent}%"></div></div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="mt-24">
      <h3 style="margin-bottom:14px;">Switch Level</h3>
      <div class="level-tabs" id="dashLevels">
        ${levels.map((l) => `<div class="level-tab ${l.code === State.user.level ? 'active' : ''}" data-code="${l.code}">${l.code} ${l.title}</div>`).join('')}
      </div>
    </div>
  `;

  $$('#dashTimeline .unit-card[data-uid]').forEach((card) => {
    card.addEventListener('click', () => navigate('unit', { unit: Number(card.dataset.uid) }));
  });
  $$('#dashLevels .level-tab').forEach((tab) => {
    tab.addEventListener('click', async () => {
      State.user.level = tab.dataset.code;
      await window.electron.updateUser(State.user);
      refreshHeader();
      navigate('dashboard');
    });
  });
}
window.__nav = navigate;

// ============================================================
// LEARN
// ============================================================
async function renderLearn(c) {
  const levels = await window.electron.getLevels();
  const units = await window.electron.getUnits(State.user.level);
  const level = levels.find((l) => l.code === State.user.level);

  c.innerHTML = `
    <h2 class="section-title">Learn — ${level.code} ${level.title}</h2>
    <div class="unit-timeline">
      ${units.map((u, i) => {
        const unlocked = unitUnlocked(u, i, units);
        const prog = unitProgress(u.id);
        return `
          <div class="unit-card ${unlocked ? '' : 'locked'} ${prog.completed ? 'completed' : ''}" ${unlocked ? `data-uid="${u.id}"` : ''}>
            <div class="u-num">${u.unit_number}</div>
            <div class="u-theme">${esc(u.theme)}</div>
            <div class="u-grammar">${esc(u.grammar_focus)}</div>
            <div class="u-progress">${prog.percent}%${prog.quizScore !== null ? ` · quiz ${prog.quizScore}%` : ''}</div>
            <div class="u-bar"><div class="u-bar-fill" style="width:${prog.percent}%"></div></div>
          </div>
        `;
      }).join('')}
    </div>
    <p class="text-muted mt-16" style="font-size:13px;">💡 Unlock each unit by scoring above 70% on the previous unit's quiz. Click a unit to open its lessons, quiz, and games.</p>
  `;

  $$('.unit-card[data-uid]').forEach((card) => {
    card.addEventListener('click', () => navigate('unit', { unit: Number(card.dataset.uid) }));
  });
}

// ============================================================
// UNIT VIEW
// ============================================================
async function renderUnit(c, unitId) {
  const allUnits = await window.electron.getUnits(State.user.level);
  const unit = allUnits.find((u) => u.id === unitId);
  if (!unit) { navigate('learn'); return; }
  State.currentUnit = unit;
  const lessons = await window.electron.getLessons(unit.id);
  const prog = unitProgress(unit.id);
  const typeLabel = { reading: '📖 Reading', vocab: '🔤 Vocabulary', grammar: '🧠 Grammar' };

  c.innerHTML = `
    <div class="lesson-header">
      <div class="breadcrumb"><span onclick="__nav('learn')">Learn</span> / Unit ${unit.unit_number}</div>
    </div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:22px;flex-wrap:wrap;">
      <div style="width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:20px;background:var(--primary-soft);color:var(--primary-dark);">${unit.unit_number}</div>
      <div>
        <h2 style="font-size:24px;font-weight:800;">${esc(unit.theme)}</h2>
        <p class="text-muted" style="font-size:14px;">Grammar focus: ${esc(unit.grammar_focus)}</p>
      </div>
      <div style="margin-left:auto;" class="gap-12">
        <span class="badge badge-green">${prog.percent}% complete</span>
        ${prog.quizScore !== null ? `<span class="badge badge-blue">Quiz: ${prog.quizScore}%</span>` : ''}
      </div>
    </div>

    <h3 style="margin-bottom:12px;">Lessons</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-bottom:26px;">
      ${lessons.map((l) => {
        const lp = State.progress.find((p) => p.unit_id === unit.id && p.lesson_type === l.type);
        const done = lp && lp.lesson_completed;
        return `
          <div class="card" style="cursor:pointer;padding:18px;" data-lid="${l.id}">
            <div style="font-size:22px;margin-bottom:8px;">${typeLabel[l.type].split(' ')[0]}</div>
            <div style="font-weight:800;margin-bottom:4px;">${typeLabel[l.type].slice(2)}</div>
            <div style="font-size:14px;color:var(--text-muted);">${esc(l.title)}</div>
            <div style="margin-top:10px;">${done ? '<span class="badge badge-green">Done</span>' : '<span class="badge badge-purple">Start</span>'}</div>
          </div>
        `;
      }).join('')}
    </div>

    <h3 style="margin-bottom:12px;">Test Yourself</h3>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <button class="btn btn-primary" id="goQuiz">🧪 Unit Quiz${prog.quizScore !== null ? ` (${prog.quizScore}%)` : ''}</button>
      <button class="btn btn-accent" id="goFlip">🃏 Flip Cards</button>
      <button class="btn btn-ghost" id="goSentence">🧩 Sentence Builder</button>
    </div>
  `;

  $$('.card[data-lid]').forEach((card) => {
    card.addEventListener('click', () => navigate('lesson', { lesson: Number(card.dataset.lid) }));
  });
  $('#goQuiz').addEventListener('click', () => navigate('quiz', { unitId: unit.id }));
  $('#goFlip').addEventListener('click', () => navigate('flipcards', { unitId: unit.id }));
  $('#goSentence').addEventListener('click', () => navigate('sentencebuilder', { unitId: unit.id }));
}

// ============================================================
// LESSON VIEW
// ============================================================
async function renderLesson(c, lessonId) {
  const lesson = await window.electron.getLesson(lessonId);
  if (!lesson) { navigate('unit', { unit: State.currentUnit ? State.currentUnit.id : 1 }); return; }
  State.currentLesson = lesson;

  const unit = State.currentUnit || (await findUnitForLesson(lesson.unit_id));
  State.currentUnit = unit;

  const content = JSON.parse(lesson.content);
  const lp = State.progress.find((p) => p.unit_id === lesson.unit_id && p.lesson_type === lesson.type);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return toast('Speech not available');
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  if (lesson.type === 'reading') {
    const text = typeof content === 'string' ? content : (content.text || '');
    const vocabList = Array.isArray(content) ? [] : (content.vocab || []);
    let html = esc(text);
    const sorted = [...vocabList].sort((a, b) => b.length - a.length);
    for (const w of sorted) {
      const regex = new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      html = html.replace(regex, '<span class="hl" data-word="$1">$1</span>');
    }

    c.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb"><span onclick="__nav('unit',{unit:${unit.id}})">Unit ${unit.unit_number}: ${esc(unit.theme)}</span> / Reading</div>
      </div>
      <div class="lesson-body">
        <div class="reader" id="readerText">${html}</div>
        <div class="vocab-side">
          <h3>New Words</h3>
          ${vocabList.map((w) => `<div class="vocab-item" data-w="${esc(w)}"><span class="w">${esc(w)}</span><div class="d">Click to hear pronunciation</div></div>`).join('')}
        </div>
      </div>
      <div class="listen-btn-row">
        <button class="btn btn-accent" id="listenFull">🔊 Listen to the full text</button>
        <button class="btn btn-ghost" id="dictationBtn">📝 Scrolling Dictation Game</button>
        <button class="btn btn-primary" id="markDone">${lp && lp.lesson_completed ? '✅ Completed' : 'Mark as Complete (+20 XP)'}</button>
      </div>
      <div id="dictationArea" class="hidden mt-24"></div>
    `;

    $('#listenFull').addEventListener('click', () => speak(text));
    $$('.vocab-item').forEach((el) => el.addEventListener('click', () => speak(el.dataset.w)));
    $$('.hl').forEach((el) => el.addEventListener('click', () => speak(el.dataset.word)));
    $('#markDone').addEventListener('click', completeLesson);
    $('#dictationBtn').addEventListener('click', () => runDictation(text, vocabList));
  } else if (lesson.type === 'vocab') {
    c.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb"><span onclick="__nav('unit',{unit:${unit.id}})">Unit ${unit.unit_number}: ${esc(unit.theme)}</span> / Vocabulary</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
          ${(Array.isArray(content) ? content : []).map((v) => `
          <div class="vocab-item" data-w="${esc(v.word)}">
            <span class="w">${esc(v.word)}</span>
            <div class="d">${esc(v.definition)}</div>
          </div>
        `).join('')}
      </div>
      <div class="listen-btn-row">
        <button class="btn btn-accent" id="listenAll">🔊 Listen to all words</button>
        <button class="btn btn-primary" id="markDone">${lp && lp.lesson_completed ? '✅ Completed' : 'Mark as Complete (+20 XP)'}</button>
      </div>
    `;
    $$('.vocab-item').forEach((el) => el.addEventListener('click', () => speak(el.dataset.w)));
    $('#listenAll').addEventListener('click', () => {
      content.forEach((v, i) => {
        const u = new SpeechSynthesisUtterance(v.word);
        u.lang = 'en-US';
        u.rate = 0.9;
        setTimeout(() => window.speechSynthesis.speak(u), i * 900);
      });
    });
    $('#markDone').addEventListener('click', completeLesson);
  } else if (lesson.type === 'grammar') {
    c.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb"><span onclick="__nav('unit',{unit:${unit.id}})">Unit ${unit.unit_number}: ${esc(unit.theme)}</span> / Grammar</div>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <h3>Explanation</h3>
        <p style="line-height:1.7;margin-top:8px;">${esc(content.explanation)}</p>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <h3>Examples</h3>
        <ul style="margin:10px 0 0 20px;line-height:2;">
          ${content.examples.map((e) => `<li style="cursor:pointer;" class="gram-ex">${esc(e)}</li>`).join('')}
        </ul>
      </div>
      ${content.tip ? `<div class="card" style="background:var(--accent-soft);border-color:rgba(28,176,246,0.3);"><h3>💡 Tip</h3><p style="margin-top:6px;">${esc(content.tip)}</p></div>` : ''}
      <div class="listen-btn-row">
        <button class="btn btn-accent" id="markDone">${lp && lp.lesson_completed ? '✅ Completed' : 'Mark as Complete (+20 XP)'}</button>
      </div>
    `;
    $$('.gram-ex').forEach((el) => el.addEventListener('click', () => speak(el.textContent)));
    $('#markDone').addEventListener('click', completeLesson);
  }
}

async function findUnitForLesson(unitId) {
  for (const lv of LEVELS_ORDER) {
    const units = await window.electron.getUnits(lv);
    const found = units.find((u) => u.id === unitId);
    if (found) return found;
  }
  return null;
}

async function completeLesson() {
  if (!State.currentLesson || !State.currentUnit) return;
  await window.electron.saveProgress({
    userId: State.user.id,
    unitId: State.currentUnit.id,
    lessonType: State.currentLesson.type,
    lessonCompleted: 1,
  });
  await window.electron.addXp({ userId: State.user.id, amount: XP_PER_LESSON });
  State.user.total_xp += XP_PER_LESSON;
  State.progress = await window.electron.getProgress(State.user.id);
  refreshHeader();
  toast(`+${XP_PER_LESSON} XP! Lesson complete.`);
  navigate('unit', { unit: State.currentUnit.id });
}

// ---------- Scrolling Dictation game ----------
function runDictation(text, vocab) {
  const words = text.replace(/[.,!?;:"]/g, ' ').split(/\s+/).filter(Boolean);
  const hiddenIdxs = new Set();
  words.forEach((w, i) => { if ((i + 1) % 5 === 0) hiddenIdxs.add(i); });
  const area = $('#dictationArea');
  area.classList.remove('hidden');
  area.innerHTML = `
    <div class="card">
      <h3>📝 Scrolling Dictation</h3>
      <p class="text-muted" style="font-size:14px;margin-bottom:14px;">Read the paragraph, then type the missing words (every 5th word is hidden).</p>
      <p id="dictText" style="line-height:2.1;font-size:17px;"></p>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-accent" id="dictSpeak">🔊 Read it aloud</button>
        <button class="btn btn-ghost" id="dictCheck">Check Answers</button>
      </div>
      <div id="dictResult" style="margin-top:14px;"></div>
    </div>
  `;

  const slots = words.map((w, i) => {
    if (hiddenIdxs.has(i)) return `<input class="dict-in" data-idx="${i}" data-answer="${esc(w.toLowerCase())}" style="width:110px;padding:4px 8px;border:2px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-family:var(--font);font-size:15px;">`;
    return esc(w);
  });
  $('#dictText').innerHTML = slots.join(' ');

  $('#dictSpeak').addEventListener('click', () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });

  $('#dictCheck').addEventListener('click', () => {
    let correct = 0;
    const total = hiddenIdxs.size;
    $$('.dict-in').forEach((inp) => {
      const got = inp.value.trim().toLowerCase().replace(/[.,!?]/g, '');
      const expected = inp.dataset.answer.replace(/[.,!?]/g, '');
      if (got === expected) { correct++; inp.style.borderColor = 'var(--primary)'; inp.style.background = 'var(--primary-soft)'; }
      else { inp.style.borderColor = 'var(--danger)'; inp.style.background = 'var(--danger-soft)'; inp.title = `Answer: ${inp.dataset.answer}`; }
    });
    const pct = Math.round((correct / total) * 100);
    $('#dictResult').innerHTML = `
      <div class="word-stats">
        <span>Score: <b style="color:var(--primary-dark);">${correct}/${total} (${pct}%)</b></span>
        <span>${pct >= 80 ? '🎉 Excellent recall!' : pct >= 50 ? '👍 Good effort — review the text again.' : '📖 Try reading the text once more, then retry.'}</span>
      </div>
    `;
  });
}

// ============================================================
// QUIZ
// ============================================================
let quizState = null;

async function renderQuiz(c, unitId) {
  const questions = await window.electron.getQuiz(unitId);
  if (!questions.length) { c.innerHTML = '<p>No quiz available.</p>'; return; }
  quizState = { questions, idx: 0, score: 0, answers: [] };
  showQuestion(c);
}

function showQuestion(c) {
  const { questions, idx } = quizState;
  if (idx >= questions.length) return showResult(c);

  const q = questions[idx];
  const options = JSON.parse(q.options_json);
  const shuffled = [...options].sort(() => Math.random() - 0.5);

  c.innerHTML = `
    <div class="quiz-container">
      <div class="lesson-header">
        <div class="breadcrumb"><span onclick="__nav('unit',{unit:${State.currentUnit.id}})">Unit ${State.currentUnit.unit_number}</span> / Quiz</div>
      </div>
      <div class="quiz-progress">${questions.map((_, i) => `<div class="quiz-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}"></div>`).join('')}</div>
      <div class="card">
        <span class="badge badge-blue" style="margin-bottom:10px;">Question ${idx + 1}/${questions.length} · ${q.type === 'mcq' ? 'Multiple Choice' : 'Fill the Blank'}</span>
        <div class="quiz-q">${esc(q.question_text)}</div>
        <div class="quiz-options" id="quizOpts">
          ${shuffled.map((o) => `<button class="quiz-opt" data-val="${esc(o)}">${esc(o)}</button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quizFb"></div>
        <div style="display:flex;justify-content:flex-end;">
          <button class="btn btn-primary hidden" id="quizNext">${idx + 1 === questions.length ? 'See Results' : 'Next Question'}</button>
        </div>
      </div>
    </div>
  `;

  let answered = false;
  $$('#quizOpts .quiz-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const val = btn.dataset.val;
      const correct = val.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      if (correct) { quizState.score++; }
      quizState.answers.push(correct);
      btn.classList.add(correct ? 'correct' : 'wrong');
      if (!correct) {
        $$('#quizOpts .quiz-opt').forEach((b) => {
          if (b.dataset.val.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) b.classList.add('correct');
        });
      }
      const fb = $('#quizFb');
      fb.className = 'quiz-feedback show ' + (correct ? 'ok' : 'no');
      fb.textContent = correct ? '✅ Correct! Well done.' : `❌ Not quite. The answer is: ${q.correct_answer}`;
      $$('#quizOpts .quiz-opt').forEach((b) => (b.disabled = true));
      $('#quizNext').classList.remove('hidden');
    });
  });
  $('#quizNext').addEventListener('click', () => { quizState.idx++; showQuestion(c); });
}

async function showResult(c) {
  const { questions, score } = quizState;
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= UNLOCK_SCORE;
  const unitId = questions[0].unit_id;

  await window.electron.saveProgress({
    userId: State.user.id,
    unitId,
    quizScore: pct,
    lessonType: 'quiz',
  });
  if (passed) {
    const earned = XP_PER_QUIZ_BASE + score * 5;
    await window.electron.addXp({ userId: State.user.id, amount: earned });
    State.user.total_xp += earned;
  }
  State.progress = await window.electron.getProgress(State.user.id);
  refreshHeader();

  c.innerHTML = `
    <div class="quiz-container">
      <div class="card result-card">
        <div style="font-size:48px;">${pct >= 90 ? '🏆' : passed ? '🎉' : '💪'}</div>
        <div class="result-score" style="color:${passed ? 'var(--primary-dark)' : 'var(--danger)'}">${pct}%</div>
        <div style="font-weight:700;font-size:18px;margin-bottom:6px;">${score}/${questions.length} correct</div>
        <div class="result-msg">
          ${passed
            ? 'Unit quiz passed! The next unit is now unlocked. 🚀'
            : `You need above ${UNLOCK_SCORE}% to unlock the next unit. Review the lessons and try again!`}
        </div>
        <div class="gap-12" style="justify-content:center;">
          <button class="btn btn-primary" onclick="__nav('unit',{unit:${unitId}})">Back to Unit</button>
          ${!passed ? `<button class="btn btn-ghost" onclick="__nav('quiz',{unitId:${unitId}})">Retry Quiz</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// GAMES HUB
// ============================================================
async function renderGames(c, unitId) {
  c.innerHTML = `
    <div class="lesson-header">
      <div class="breadcrumb"><span onclick="__nav('unit',{unit:${unitId}})">Unit</span> / Games</div>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-lg" onclick="__nav('flipcards',{unitId:${unitId}})">🃏 Flip Cards</button>
      <button class="btn btn-accent btn-lg" onclick="__nav('sentencebuilder',{unitId:${unitId}})">🧩 Sentence Builder</button>
    </div>
  `;
}

// ============================================================
// GAME 1: FLIP CARDS
// ============================================================
async function renderFlipCards(c, unitId) {
  const game = await window.electron.getGame(unitId, 'flip_cards');
  if (!game) { c.innerHTML = '<p>No game data found.</p>'; return; }
  const pairs = JSON.parse(game.data_json).pairs;
  const cards = [];
  pairs.forEach((w, i) => {
    cards.push({ label: w, kind: 'word', pair: i });
    cards.push({ label: pairs[i], kind: 'def', pair: i });
  });
  const words = cards.filter((x) => x.kind === 'word');
  const defs = cards.filter((x) => x.kind === 'def').sort(() => Math.random() - 0.5);
  const deck = [];
  for (let i = 0; i < words.length; i++) { deck.push(words[i], defs[i]); }
  const shuffled = deck.sort(() => Math.random() - 0.5);

  let flipped = [];
  let matched = 0;
  let moves = 0;
  let locked = false;

  c.innerHTML = `
    <div class="lesson-header">
      <div class="breadcrumb"><span onclick="__nav('unit',{unit:${unitId}})">Unit ${State.currentUnit.unit_number}</span> / Flip Cards</div>
    </div>
    <div class="gap-12" style="margin-bottom:18px;">
      <h3>🃏 Match each word to its definition</h3>
      <div style="margin-left:auto;" class="gap-12">
        <span class="stat-chip">Moves: <b id="fcMoves">0</b></span>
        <span class="stat-chip">Matched: <b id="fcMatched">0/${pairs.length}</b></span>
        <button class="btn btn-ghost" id="fcRestart">🔄 Restart</button>
      </div>
    </div>
    <div class="flip-grid" id="flipGrid">
      ${shuffled.map((card, i) => `
        <div class="flip-card" data-i="${i}" data-pair="${card.pair}" data-kind="${card.kind}">
          <div class="flip-card-inner">
            <div class="flip-card-front">?</div>
            <div class="flip-card-back">${esc(card.label)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  $$('#flipGrid .flip-card').forEach((el) => {
    el.addEventListener('click', () => {
      if (locked || el.classList.contains('flipped') || el.classList.contains('matched')) return;
      el.classList.add('flipped');
      flipped.push(el);
      if (flipped.length === 2) {
        moves++;
        $('#fcMoves').textContent = moves;
        locked = true;
        const [a, b] = flipped;
        if (a.dataset.pair === b.dataset.pair && a.dataset.kind !== b.dataset.kind) {
          setTimeout(() => {
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            $('#fcMatched').textContent = `${matched}/${pairs.length}`;
            flipped = [];
            locked = false;
            if (matched === pairs.length) {
              toast('🎉 All matched! +15 XP');
              window.electron.addXp({ userId: State.user.id, amount: 15 })
                .then(() => { State.user.total_xp += 15; refreshHeader(); });
            }
          }, 450);
        } else {
          setTimeout(() => {
            a.classList.remove('flipped');
            b.classList.remove('flipped');
            flipped = [];
            locked = false;
          }, 900);
        }
      }
    });
  });
  $('#fcRestart').addEventListener('click', () => renderFlipCards(c, unitId));
}

// ============================================================
// GAME 2: SENTENCE BUILDER
// ============================================================
let sbState = null;

async function renderSentenceBuilder(c, unitId) {
  const game = await window.electron.getGame(unitId, 'sentence_builder');
  if (!game) { c.innerHTML = '<p>No game data found.</p>'; return; }
  const sentences = JSON.parse(game.data_json).sentences;

  sbState = { sentences, idx: 0, score: 0, timer: null, seconds: 30 };
  setupSentence(c, unitId);
}

function setupSentence(c, unitId) {
  const { sentences, idx } = sbState;
  if (idx >= sentences.length) return sbResult(c, unitId);

  const sentence = sentences[idx];
  const words = sentence.split(/\s+/);
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  sbState.placed = [];
  sbState.seconds = 20 + words.length * 4;

  c.innerHTML = `
    <div class="lesson-header">
      <div class="breadcrumb"><span onclick="__nav('unit',{unit:${unitId}})">Unit ${State.currentUnit.unit_number}</span> / Sentence Builder</div>
    </div>
    <div class="sb-area">
      <div class="gap-12" style="margin-bottom:12px;">
        <h3>🧩 Sentence ${idx + 1}/${sentences.length} — click words in the correct order</h3>
        <div class="sb-timer" style="margin-left:auto;">⏱ <span id="sbTime">${sbState.seconds}</span>s</div>
      </div>
      <div class="sb-answer" id="sbAnswer"></div>
      <div class="sb-pool" id="sbPool">
        ${shuffled.map((w, i) => `<button class="sb-word" data-word="${esc(w)}" data-i="${i}">${esc(w)}</button>`).join('')}
      </div>
      <div class="gap-12">
        <button class="btn btn-ghost" id="sbShuffle">🔀 Shuffle</button>
        <button class="btn btn-danger" id="sbClear">Clear</button>
        <button class="btn btn-primary" id="sbCheck" style="margin-left:auto;">Check</button>
      </div>
      <div class="sb-result" id="sbResult"></div>
    </div>
  `;

  function rebuildPoolMarks() {
    const counts = {};
    $$('#sbPool .sb-word').forEach((el) => {
      const w = el.dataset.word;
      const n = (counts[w] = (counts[w] || 0) + 1);
      const placedSame = sbState.placed.filter((x) => x === w).length;
      el.classList.toggle('placed', n <= placedSame);
    });
  }

  function renderAnswer() {
    $('#sbAnswer').innerHTML = sbState.placed.length
      ? sbState.placed.map((w, i) => `<button class="sb-word" data-pi="${i}">${esc(w)}</button>`).join('')
      : '<span class="text-muted" style="font-size:14px;">Tap words below to build the sentence…</span>';
    rebuildPoolMarks();
    $$('#sbAnswer .sb-word').forEach((el) => {
      el.addEventListener('click', () => {
        const pi = Number(el.dataset.pi);
        sbState.placed.splice(pi, 1);
        renderAnswer();
      });
    });
  }

  $$('#sbPool .sb-word').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.classList.contains('placed')) return;
      sbState.placed.push(el.dataset.word);
      renderAnswer();
    });
  });

  $('#sbShuffle').addEventListener('click', () => {
    const pool = $('#sbPool');
    [...pool.children].sort(() => Math.random() - 0.5).forEach((el) => pool.appendChild(el));
    rebuildPoolMarks();
  });
  $('#sbClear').addEventListener('click', () => { sbState.placed = []; renderAnswer(); });

  clearInterval(sbState.timer);
  sbState.timer = setInterval(() => {
    sbState.seconds--;
    const t = $('#sbTime');
    if (t) t.textContent = sbState.seconds;
    if (sbState.seconds <= 0) {
      clearInterval(sbState.timer);
      sbCheckSentence(c, unitId, true);
    }
  }, 1000);

  $('#sbCheck').addEventListener('click', () => sbCheckSentence(c, unitId, false));
  renderAnswer();
}

function sbCheckSentence(c, unitId, timedOut) {
  clearInterval(sbState.timer);
  const target = sbState.sentences[sbState.idx];
  const built = sbState.placed.join(' ');
  const ok = built.trim().toLowerCase() === target.trim().toLowerCase();
  if (ok) sbState.score++;

  const res = $('#sbResult');
  res.className = 'sb-result show ' + (ok ? 'ok' : 'no');
  res.innerHTML = ok
    ? `✅ Correct! "${esc(target)}"`
    : `${timedOut ? '⏱ Time\u2019s up! ' : '❌ Not quite. '}The correct sentence: <b>${esc(target)}</b>`;

  $$('#sbPool .sb-word, #sbAnswer .sb-word').forEach((el) => (el.style.pointerEvents = 'none'));
  $('#sbCheck').disabled = true;

  setTimeout(() => { sbState.idx++; setupSentence(c, unitId); }, 2400);
}

function sbResult(c, unitId) {
  clearInterval(sbState.timer);
  const { sentences, score } = sbState;
  const pct = Math.round((score / sentences.length) * 100);
  c.innerHTML = `
    <div class="sb-area">
      <div class="card result-card">
        <div style="font-size:48px;">${pct >= 80 ? '🏆' : '💪'}</div>
        <div class="result-score" style="color:${pct >= 80 ? 'var(--primary-dark)' : 'var(--accent)'}">${pct}%</div>
        <div class="result-msg">${score}/${sentences.length} sentences built correctly${pct >= 80 ? '. +15 XP earned!' : '. Keep practicing!'}</div>
        <div class="gap-12" style="justify-content:center;">
          <button class="btn btn-primary" onclick="__nav('unit',{unit:${State.currentUnit.id}})">Back to Unit</button>
          <button class="btn btn-ghost" onclick="__nav('sentencebuilder',{unitId:${unitId}})">Play Again</button>
        </div>
      </div>
    </div>
  `;
  if (pct >= 80) {
    window.electron.addXp({ userId: State.user.id, amount: 15 })
      .then(() => { State.user.total_xp += 15; refreshHeader(); });
  }
}

// ============================================================
// LISTENING LAB
// ============================================================
async function renderListening(c, unitId) {
  let sentences = ['The quick brown fox jumps over the lazy dog.', 'She sells seashells by the seashore.', 'I would like a cup of coffee, please.'];
  if (unitId) {
    const game = await window.electron.getGame(unitId, 'sentence_builder');
    if (game) sentences = JSON.parse(game.data_json).sentences;
  }

  let current = null;
  let attempts = 0;
  let bestPct = 0;

  function pick() {
    current = sentences[Math.floor(Math.random() * sentences.length)];
  }
  pick();

  function speakSentence(rate = 0.9) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(current);
    u.lang = 'en-US';
    u.rate = rate;
    window.speechSynthesis.speak(u);
  }

  function wordMatchPct(target, got) {
    const tw = target.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/);
    const gw = got.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/);
    if (!tw.length) return { pct: 0, chips: [] };
    const used = new Array(tw.length).fill(false);
    const chips = gw.map((w) => {
      const i = tw.findIndex((t, j) => !used[j] && t === w);
      if (i >= 0) { used[i] = true; return { w, good: true }; }
      return { w, good: false };
    });
    const good = chips.filter((x) => x.good).length;
    const missing = tw.length - good;
    const denom = Math.max(tw.length, gw.length);
    const pct = Math.round(((good - missing) / denom) * 100);
    return { pct: Math.max(0, pct), chips };
  }

  function render() {
    c.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb"><span onclick="__nav('dashboard')">Home</span> / Listening Lab${unitId ? ` · <span onclick="__nav('unit',{unit:${unitId}})">Unit ${State.currentUnit.unit_number}</span>` : ''}</div>
      </div>
      <div class="card listen-game">
        <h3>🎧 Listen & Fill</h3>
        <p class="text-muted" style="font-size:14px;margin-bottom:8px;">Press play, listen carefully, then type exactly what you heard.</p>
        <div style="display:flex;gap:10px;margin:12px 0;">
          <button class="btn btn-accent" id="lgSlow">🐢 Slow</button>
          <button class="btn btn-accent" id="lgNormal">🔊 Normal</button>
        </div>
        <div class="listen-prompt" style="filter:blur(8px);user-select:none;" title="Secret sentence">● ● ● ● ● ● ● ● ●</div>
        <input class="form-input listen-input" id="lgInput" placeholder="Type what you heard…" autocomplete="off">
        <div style="display:flex;gap:10px;margin-top:4px;">
          <button class="btn btn-primary" id="lgCheck">Check Answer</button>
          <button class="btn btn-ghost" id="lgReveal">👁 Reveal</button>
          <button class="btn btn-ghost" id="lgNext" style="margin-left:auto;">Next Sentence →</button>
        </div>
        <div class="word-accuracy hidden" id="lgAccuracy"></div>
        <div class="word-stats" style="margin-top:14px;">
          <span>Attempts: <b>${attempts}</b></span>
          <span>Best: <b style="color:var(--primary-dark);">${bestPct}%</b></span>
        </div>
      </div>
    `;
    $('#lgSlow').addEventListener('click', () => speakSentence(0.65));
    $('#lgNormal').addEventListener('click', () => speakSentence(0.9));
    $('#lgCheck').addEventListener('click', () => {
      const got = $('#lgInput').value.trim();
      if (!got) return toast('Type what you heard first');
      const { pct, chips } = wordMatchPct(current, got);
      attempts++;
      bestPct = Math.max(bestPct, pct);
      const acc = $('#lgAccuracy');
      acc.classList.remove('hidden');
      acc.innerHTML = `
        <div style="font-weight:800;font-size:18px;margin-bottom:8px;color:${pct === 100 ? 'var(--primary-dark)' : 'var(--text)'}">Word accuracy: ${pct}%</div>
        ${chips.map((ch) => `<span class="word-chip ${ch.good ? 'good' : 'bad'}">${esc(ch.w)}</span>`).join('')}
        ${pct === 100 ? '<div style="margin-top:10px;font-weight:700;color:var(--primary-dark);">🎉 Perfect! +10 XP</div>' : '<div style="margin-top:10px;color:var(--text-muted);font-size:14px;">Green = matched, red = unmatched. Listen again and retry!</div>'}
      `;
      if (pct === 100) {
        window.electron.addXp({ userId: State.user.id, amount: 10 })
          .then(() => { State.user.total_xp += 10; refreshHeader(); });
      }
    });
    $('#lgReveal').addEventListener('click', () => {
      const p = $('.listen-prompt');
      p.style.filter = 'none';
      p.style.userSelect = 'auto';
      p.textContent = current;
    });
    $('#lgNext').addEventListener('click', () => { pick(); render(); });
    $('#lgInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('#lgCheck').click();
    });
  }
  render();
}

// ============================================================
// SPEAKING LAB
// ============================================================
let speakSentences = [];

async function renderSpeaking(c, unitId) {
  if (unitId) {
    const game = await window.electron.getGame(unitId, 'sentence_builder');
    speakSentences = game ? JSON.parse(game.data_json).sentences : defaultSpeakSentences();
  } else {
    speakSentences = defaultSpeakSentences();
  }
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    c.innerHTML = `
      <div class="card"><h3>🎤 Speaking Practice</h3>
      <p class="text-muted">Speech recognition is not available in this environment. It works on systems with an English speech engine installed.</p></div>`;
    return;
  }

  let currentIdx = Math.floor(Math.random() * speakSentences.length);
  let recognition = null;
  let recording = false;

  function levDist(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => (i === 0 ? Array.from({ length: n + 1 }, (_, j) => j) : new Array(n + 1).fill(0)));
    for (let i = 1; i <= m; i++) {
      dp[i][0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  function wordAccuracy(target, spoken) {
    const tw = target.toLowerCase().replace(/[.,!?;:'"]/g, '').split(/\s+/);
    const sw = spoken.toLowerCase().replace(/[.,!?;:'"]/g, '').split(/\s+/);
    const used = new Set();
    let matches = 0;
    for (const t of tw) {
      let best = Infinity;
      for (let j = 0; j < sw.length; j++) {
        if (used.has(j)) continue;
        const d = levDist(t, sw[j]);
        if (d < best) { best = d; }
      }
      let bi = -1;
      for (let j = 0; j < sw.length; j++) {
        if (used.has(j)) continue;
        const d = levDist(t, sw[j]);
        if (d < best) { best = d; bi = j; }
      }
      if (bi >= 0 && best <= 1) { matches++; used.add(bi); }
    }
    return Math.round((matches / tw.length) * 100);
  }

  function render() {
    const sentence = speakSentences[currentIdx];
    c.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb"><span onclick="__nav('dashboard')">Home</span> / Speaking Lab${unitId ? ` · <span onclick="__nav('unit',{unit:${unitId}})">Unit ${State.currentUnit.unit_number}</span>` : ''}</div>
      </div>
      <div class="card speak-game">
        <h3>🎤 Say it like a native</h3>
        <p class="text-muted" style="font-size:14px;">Listen to the sentence, then press the microphone and speak it aloud. We'll score your pronunciation accuracy.</p>
        <div style="display:flex;gap:10px;margin:16px 0;justify-content:center;">
          <button class="btn btn-accent" id="spListen">🔊 Listen</button>
          <button class="btn btn-ghost" id="spNext">Next Sentence →</button>
        </div>
        <div class="speak-target">${esc(sentence)}</div>
        <div style="text-align:center;">
          <button class="rec-btn" id="spRec" title="Click to record">🎙</button>
        </div>
        <div class="speak-status" id="spStatus">Click the microphone and speak the sentence…</div>
        <div class="accuracy-display" id="spAccuracy">
          <div class="accuracy-pct" id="spPct">0%</div>
          <div class="accuracy-bar"><div class="accuracy-bar-fill" id="spBar" style="width:0%"></div></div>
          <div class="transcript" id="spTranscript"></div>
        </div>
      </div>
    `;

    $('#spListen').addEventListener('click', () => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = 'en-US'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    });
    $('#spNext').addEventListener('click', () => {
      currentIdx = (currentIdx + 1) % speakSentences.length;
      render();
    });
    $('#spRec').addEventListener('click', () => {
      if (recording) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SR();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        recording = true;
        $('#spRec').classList.add('recording');
        $('#spStatus').textContent = 'Listening… speak now!';
        $('#spAccuracy').classList.remove('show');
      };
      recognition.onresult = (ev) => {
        const transcript = ev.results[0][0].transcript;
        const pct = wordAccuracy(sentence, transcript);
        $('#spPct').textContent = `${pct}%`;
        $('#spBar').style.width = `${pct}%`;
        $('#spTranscript').textContent = `You said: "${transcript}"`;
        $('#spAccuracy').classList.add('show');
        if (pct >= 85) {
          $('#spStatus').textContent = '🎉 Excellent pronunciation! +15 XP';
          window.electron.addXp({ userId: State.user.id, amount: 15 })
            .then(() => { State.user.total_xp += 15; refreshHeader(); });
        } else if (pct >= 60) {
          $('#spStatus').textContent = '👍 Good! Try again to get above 85%.';
        } else {
          $('#spStatus').textContent = '💪 Keep practicing — listen first, then try again.';
        }
      };
      recognition.onerror = (ev) => {
        $('#spStatus').textContent = `⚠️ ${ev.error === 'no-speech' ? 'No speech detected. Try again.' : ev.error === 'not-allowed' ? 'Microphone access denied. Please allow microphone permission.' : 'Recognition error: ' + ev.error}`;
      };
      recognition.onend = () => {
        recording = false;
        $('#spRec').classList.remove('recording');
      };
      try {
        recognition.start();
      } catch (e) {
        $('#spStatus').textContent = '⚠️ Could not start recognition.';
      }
    });
  }
  render();
}

function defaultSpeakSentences() {
  return [
    'How are you doing today?',
    'I would like a cup of coffee, please.',
    'The weather is beautiful this morning.',
    'Can you help me find the train station?',
    'She has been studying English for two years.',
    'I think we should leave before it starts raining.',
    'Would you mind closing the window, please?',
    'The quick brown fox jumps over the lazy dog.',
  ];
}

// ============================================================
// PROGRESS PAGE
// ============================================================
async function renderProgress(c) {
  const units = await window.electron.getUnits(State.user.level);

  const totalLessons = units.length * 3;
  const quizzes = State.progress.filter((p) => p.quiz_score !== null);
  const avg = quizzes.length ? Math.round(quizzes.reduce((s, p) => s + p.quiz_score, 0) / quizzes.length) : 0;

  c.innerHTML = `
    <h2 class="section-title">Your Progress</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:26px;">
      <div class="mini-stat"><div class="val">⚡ ${State.user.total_xp}</div><div class="lbl">Total XP</div></div>
      <div class="mini-stat"><div class="val">🔥 ${State.user.streak_days}</div><div class="lbl">Day Streak</div></div>
      <div class="mini-stat"><div class="val">✅ ${State.progress.filter((p) => p.lesson_completed).length}/${totalLessons}</div><div class="lbl">Lessons Done</div></div>
      <div class="mini-stat"><div class="val">🧪 ${quizzes.length}/${units.length}</div><div class="lbl">Quizzes Taken</div></div>
      <div class="mini-stat"><div class="val">📈 ${avg}%</div><div class="lbl">Avg Quiz Score</div></div>
    </div>

    <h3 style="margin-bottom:12px;">Level ${State.user.level} — Unit Details</h3>
    <div class="card" style="padding:0;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:var(--bg);text-align:left;">
            <th style="padding:12px 16px;font-size:12px;text-transform:uppercase;color:var(--text-muted);">Unit</th>
            <th style="padding:12px 16px;font-size:12px;text-transform:uppercase;color:var(--text-muted);">Reading</th>
            <th style="padding:12px 16px;font-size:12px;text-transform:uppercase;color:var(--text-muted);">Vocab</th>
            <th style="padding:12px 16px;font-size:12px;text-transform:uppercase;color:var(--text-muted);">Grammar</th>
            <th style="padding:12px 16px;font-size:12px;text-transform:uppercase;color:var(--text-muted);">Quiz</th>
          </tr>
        </thead>
        <tbody>
          ${units.map((u) => {
            const pp = State.progress.filter((p) => p.unit_id === u.id);
            const cell = (type) => {
              const entry = pp.find((p) => p.lesson_type === type);
              return entry && entry.lesson_completed ? '✅' : '—';
            };
            const q = pp.find((p) => p.quiz_score !== null);
            return `
              <tr style="border-top:1px solid var(--border);cursor:pointer;" data-uid="${u.id}">
                <td style="padding:12px 16px;font-weight:700;">${u.unit_number}. ${esc(u.theme)}</td>
                <td style="padding:12px 16px;text-align:center;">${cell('reading')}</td>
                <td style="padding:12px 16px;text-align:center;">${cell('vocab')}</td>
                <td style="padding:12px 16px;text-align:center;">${cell('grammar')}</td>
                <td style="padding:12px 16px;text-align:center;font-weight:700;color:${q ? (q.quiz_score >= UNLOCK_SCORE ? 'var(--primary-dark)' : 'var(--danger)') : 'inherit'};">${q ? q.quiz_score + '%' : '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="text-muted mt-16" style="font-size:13px;">Use "Export Report" in the sidebar to download your full progress as a JSON file.</p>
  `;

  $$('tbody tr[data-uid]').forEach((tr) => {
    tr.addEventListener('click', () => navigate('unit', { unit: Number(tr.dataset.uid) }));
  });
}

// ============================================================
// WRITING LAB
// ============================================================
async function renderWriting(c) {
  const prompts = (await window.electron.getWritingPrompts(State.user.level)) || defaultWritingPrompts();

  const RULES = [
    { id: 'double-space', test: (t) => /\S {2,}\S/.test(t), msg: 'Double space detected. Use a single space between words.' },
    { id: 'lowercase-i', test: (t) => /(^|[^a-zA-Z]| )i(?!')($|[^a-zA-Z]| )/.test(t), msg: 'The pronoun "I" is always capitalized.' },
    {
      id: 'sentence-start', test: (t) => /(^|[.!?]\s+)([a-z])/.test(t),
      msg: 'Sentences should start with a capital letter.'
    },
    { id: 'missing-period', test: (t) => t.trim().length > 0 && !/[.!?]$/.test(t.trim()), msg: 'End your sentences with proper punctuation (., !, or ?).' },
    { id: 'missing-comma-before', test: (t) => /\b(but|and|because|so|yet)\s+[a-z]/.test(t), msg: 'Consider a comma before conjunctions like "but", "and", "so", and "because" when connecting clauses.' },
    {
      id: 'dont', test: (t) => /\b(dont|cant|wont|isnt|arent|didnt|doesnt|wasnt|werent|hasnt|havent|hadnt|wouldnt|shouldnt|couldnt)\b/.test(t),
      msg: 'Contractions need an apostrophe: don\u2019t, can\u2019t, won\u2019t, isn\u2019t, aren\u2019t.'
    },
    { id: 'your-youre', test: (t) => /\byour (am|is|are|not|going|welcome|right|wrong|sure|the)\b/.test(t), msg: 'Use "you\u2019re" (you are) here, not "your" (possessive).' },
    { id: 'there-their', test: (t) => /\btheir (is|are|was|were)\b/.test(t), msg: 'Use "there" (place/existence), not "their" (possessive).' },
    { id: 'then-than', test: (t) => /\b(more|less|better|worse|bigger|faster|older|higher)\s+then\b/.test(t), msg: 'Comparisons use "than" (comparison), not "then" (time).' },
    { id: 'alot', test: (t) => /\balot\b/.test(t), msg: '"A lot" is two words.' },
    { id: 'gonna-wanna', test: (t) => /\b(gonna|wanna|gotta)\b/.test(t), msg: 'In formal writing use "going to", "want to", "got to".' },
    { id: 'double-neg', test: (t) => /\b(don\u2019t|don't|doesn\u2019t|doesn't|didn\u2019t|didn't)\s+\w+\s+\b(no|nothing|nobody|never)\b/.test(t), msg: 'Avoid double negatives: "I don\u2019t have nothing" \u2192 "I don\u2019t have anything".' },
    {
      id: 'runon', test: (t) => /\b\w+( \w+){39,}\b/.test(t.replace(/[.!?]/g, ' ')),
      msg: 'Long sentences without punctuation may be run-ons. Try splitting them.'
    }
  ];

  let currentPromptIdx = Math.floor(Math.random() * prompts.length);

  function analyze() {
    const text = $('#writeArea').value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    const errors = [];
    if (!text) { $('#writeErrors').innerHTML = ''; $('#writeStats').textContent = ''; return; }

    for (const rule of RULES) {
      if (rule.test(text)) errors.push({ id: rule.id, msg: rule.msg });
    }

    const el = $('#writeErrors');
    if (!errors.length) {
      el.innerHTML = '<div style="padding:14px 18px;border-radius:var(--radius-sm);background:var(--primary-soft);border:1px solid rgba(88,204,2,0.4);font-weight:700;color:var(--primary-dark);">✅ No issues detected. Great job!</div>';
    } else {
      el.innerHTML = errors.map((e, i) => `
        <div class="error-item">
          <span style="font-weight:800;flex-shrink:0;">${i + 1}.</span>
          <span>${esc(e.msg)}</span>
        </div>
      `).join('');
    }

    const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;
    const avgLen = (wordCount / sentenceCount).toFixed(1);
    $('#writeStats').textContent = `${wordCount} words · ${sentenceCount} sentence(s) · avg ${avgLen} words/sentence`;
  }

  c.innerHTML = `
    <div class="lesson-header">
      <div class="breadcrumb"><span onclick="__nav('dashboard')">Home</span> / Writing Lab</div>
    </div>
    <div class="writing-lab">
      <div class="card">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;">
          <h3 style="margin-bottom:0;">✍️ Writing Lab</h3>
          <button class="btn btn-ghost" id="newPrompt" style="margin-left:auto;padding:8px 14px;font-size:13px;">🎲 New Prompt</button>
        </div>
        <div class="writing-prompt" id="writingPrompt">${esc(prompts[currentPromptIdx])}</div>
        <textarea class="writing-area" id="writeArea" placeholder="Write your response here… (100-150 words recommended)"></textarea>
        <div class="word-stats" id="writeStats"></div>
        <div class="writing-tools">
          <button class="btn btn-primary" id="checkWriting">🔍 Check My Writing</button>
          <button class="btn btn-accent" id="speakWriting">🔊 Read My Text Aloud</button>
          <button class="btn btn-ghost" id="clearWriting">Clear</button>
        </div>
        <div class="error-list" id="writeErrors"></div>
      </div>
    </div>
  `;

  $('#checkWriting').addEventListener('click', analyze);
  $('#writeArea').addEventListener('input', () => {
    const text = $('#writeArea').value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    $('#writeStats').textContent = `${wordCount} word(s)`;
  });
  $('#speakWriting').addEventListener('click', () => {
    const text = $('#writeArea').value.trim();
    if (!text) return toast('Write something first');
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.95;
    window.speechSynthesis.speak(u);
  });
  $('#clearWriting').addEventListener('click', () => {
    $('#writeArea').value = '';
    $('#writeErrors').innerHTML = '';
    $('#writeStats').textContent = '';
  });
  $('#newPrompt').addEventListener('click', () => {
    currentPromptIdx = Math.floor(Math.random() * prompts.length);
    $('#writingPrompt').textContent = prompts[currentPromptIdx];
  });
}

function defaultWritingPrompts() {
  return [
    'Describe your morning routine in 100-150 words.',
    'Write about your favorite holiday and why you enjoy it.',
    'Describe the city or town where you live.',
    'Write an email to a friend inviting them to your birthday party.',
    'Describe what you did last weekend.',
    'Write about a person who inspires you and explain why.',
    'Describe your dream job and what you would do every day.',
    'Write about a challenge you overcame and what you learned.',
    'Describe your favorite season and the activities you enjoy during it.',
    'Write a short story that begins with: "It was a rainy morning when..."'
  ];
}

// ============================================================
// INIT
// ============================================================
applyTheme();
initOnboarding();
