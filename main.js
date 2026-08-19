/* ============================================================
   YourTeacher - Electron Main Process
   - BrowserWindow lifecycle
   - SQLite database initialization (better-sqlite3)
   - IPC handlers for all data operations
   - Progress report export via file dialog
   ============================================================ */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const {
  SCHEMA_SQL,
  SEED_LEVELS,
  SEED_UNITS,
  SEED_LESSONS,
  SEED_QUESTIONS,
  SEED_GAMES
} = require('./database/init');

// -----------------------------------------------------------
// Window
// -----------------------------------------------------------
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    title: 'YourTeacher - Learn English Offline',
    icon: __dirname,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// -----------------------------------------------------------
// Database
// -----------------------------------------------------------
let db = null;

function getDb() {
  if (!db) {
    const dataDir = path.join(app.getPath('userData'), 'yourteacher');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, 'yourteacher.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb();
  }
  return db;
}

function initDb() {
  db.exec(SCHEMA_SQL);

  // seed only if levels table empty
  const count = db.prepare('SELECT COUNT(*) as c FROM levels').get().c;
  if (count === 0) {
    const seedUnits = db.prepare('INSERT INTO units (level_id, unit_number, theme, grammar_focus) VALUES (?, ?, ?, ?)');
    const seedLessons = db.prepare('INSERT INTO lessons (unit_id, type, title, content, audio_url) VALUES (?, ?, ?, ?, ?)');
    const seedQuestions = db.prepare('INSERT INTO quiz_questions (unit_id, type, question_text, options_json, correct_answer) VALUES (?, ?, ?, ?, ?)');
    const seedGames = db.prepare('INSERT INTO games (unit_id, game_type, data_json) VALUES (?, ?, ?)');

    SEED_LEVELS.forEach((l) => {
      db.prepare('INSERT INTO levels (code, title) VALUES (?, ?)').run(l.code, l.title);
    });

    const levelIds = {};
    SEED_LEVELS.forEach((l, li) => { levelIds[l.code] = li + 1; });

    const unitIds = {};
    SEED_UNITS.forEach((u) => {
      const res = seedUnits.run(levelIds[u.level], u.unit_number, u.theme, u.grammar_focus);
      unitIds[`${u.level}|${u.unit_number}`] = res.lastInsertRowid;
    });

    SEED_LESSONS.forEach((l) => {
      const unitId = unitIds[`${l.level}|${l.unit}`];
      seedLessons.run(unitId, l.type, l.title, l.content, l.audio_url || null);
    });

    SEED_QUESTIONS.forEach((q) => {
      const unitId = unitIds[`${q.level}|${q.unit}`];
      seedQuestions.run(unitId, q.type, q.question_text, q.options_json, q.correct_answer);
    });

    SEED_GAMES.forEach((g) => {
      const unitId = unitIds[`${g.level}|${g.unit}`];
      seedGames.run(unitId, g.game_type, g.data_json);
    });
  }
}

// -----------------------------------------------------------
// IPC: Levels & Units
// -----------------------------------------------------------
ipcMain.handle('getLevels', () => getDb().prepare('SELECT * FROM levels ORDER BY id').all());

ipcMain.handle('getUnits', (_e, levelCode) => {
  const db = getDb();
  const level = db.prepare('SELECT id FROM levels WHERE code = ?').get(levelCode);
  if (!level) return [];
  return db.prepare('SELECT * FROM units WHERE level_id = ? ORDER BY unit_number').all(level.id);
});

// -----------------------------------------------------------
// IPC: Lessons
// -----------------------------------------------------------
ipcMain.handle('getLessons', (_e, unitId) =>
  getDb().prepare('SELECT * FROM lessons WHERE unit_id = ? ORDER BY type').all(unitId)
);

ipcMain.handle('getLesson', (_e, lessonId) =>
  getDb().prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId)
);

// -----------------------------------------------------------
// IPC: Quiz
// -----------------------------------------------------------
ipcMain.handle('getQuiz', (_e, unitId) =>
  getDb().prepare('SELECT * FROM quiz_questions WHERE unit_id = ?').all(unitId)
);

// -----------------------------------------------------------
// IPC: Games
// -----------------------------------------------------------
ipcMain.handle('getGame', (_e, unitId, gameType) =>
  getDb().prepare('SELECT * FROM games WHERE unit_id = ? AND game_type = ?').get(unitId, gameType)
);

// -----------------------------------------------------------
// IPC: Users
// -----------------------------------------------------------
ipcMain.handle('getUsers', () => getDb().prepare('SELECT * FROM users').all());

ipcMain.handle('createUser', (_e, { name, level }) =>
  getDb().prepare('INSERT INTO users (name, level, total_xp, streak_days) VALUES (?, ?, 0, 0)').run(name, level)
);

ipcMain.handle('updateUser', (_e, user) => {
  const { id, name, level, total_xp, streak_days } = user;
  getDb().prepare('UPDATE users SET name=?, level=?, total_xp=?, streak_days=? WHERE id=?')
    .run(name, level, total_xp, streak_days, id);
  return { success: true };
});

// -----------------------------------------------------------
// IPC: Progress
// -----------------------------------------------------------
ipcMain.handle('getProgress', (_e, userId) =>
  getDb().prepare('SELECT * FROM user_progress WHERE user_id = ?').all(userId)
);

ipcMain.handle('saveProgress', (_e, { userId, unitId, lessonType, lessonCompleted, quizScore }) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  if (quizScore !== undefined && quizScore !== null) {
    // upsert quiz score (keep best score? latest attempt - store latest)
    const existing = db.prepare(
      'SELECT id FROM user_progress WHERE user_id=? AND unit_id=? AND lesson_type=?'
    ).get(userId, unitId, lessonType);
    if (existing) {
      db.prepare('UPDATE user_progress SET quiz_score=?, last_attempt=? WHERE id=?')
        .run(quizScore, today, existing.id);
    } else {
      db.prepare('INSERT INTO user_progress (user_id, unit_id, lesson_type, lesson_completed, quiz_score, last_attempt) VALUES (?, ?, ?, 0, ?, ?)')
        .run(userId, unitId, lessonType, quizScore, today);
    }
  } else if (lessonCompleted) {
    const existing = db.prepare(
      'SELECT id, lesson_completed FROM user_progress WHERE user_id=? AND unit_id=? AND lesson_type=?'
    ).get(userId, unitId, lessonType);
    if (existing) {
      if (!existing.lesson_completed) {
        db.prepare('UPDATE user_progress SET lesson_completed=1, last_attempt=? WHERE id=?').run(today, existing.id);
      }
    } else {
      db.prepare('INSERT INTO user_progress (user_id, unit_id, lesson_type, lesson_completed, quiz_score, last_attempt) VALUES (?, ?, ?, 1, NULL, ?)')
        .run(userId, unitId, lessonType, today);
    }
  }
  return { success: true };
});

// -----------------------------------------------------------
// IPC: XP
// -----------------------------------------------------------
ipcMain.handle('addXp', (_e, { userId, amount }) => {
  getDb().prepare('UPDATE users SET total_xp = total_xp + ? WHERE id = ?').run(amount, userId);
  return { success: true };
});

// -----------------------------------------------------------
// IPC: Writing prompts (provided in renderer as fallback)
// -----------------------------------------------------------
ipcMain.handle('getWritingPrompts', (_e, levelCode) => {
  return null; // renderer uses built-in prompts
});

// -----------------------------------------------------------
// IPC: Export progress report
// -----------------------------------------------------------
ipcMain.handle('exportProgressReport', async (_e, { userId }) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return { success: false, filePath: null };

  const levels = db.prepare('SELECT * FROM levels').all();
  const units = db.prepare('SELECT * FROM units').all();
  const lessons = db.prepare('SELECT * FROM lessons').all();
  const progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').all(userId);
  const quizzes = db.prepare('SELECT * FROM quiz_questions').all();

  const report = {
    exportedAt: new Date().toISOString(),
    app: 'YourTeacher v1.0.0',
    user,
    levels,
    units,
    lessons: lessons.map((l) => ({ ...l, content: '[omitted]' })),
    progress,
    summary: {
      totalXp: user.total_xp,
      streakDays: user.streak_days,
      lessonsCompleted: progress.filter((p) => p.lesson_completed).length,
      quizzesTaken: progress.filter((p) => p.quiz_score !== null).length,
      averageQuizScore: progress.filter((p) => p.quiz_score !== null)
        .reduce((s, p) => s + p.quiz_score, 0) / Math.max(1, progress.filter((p) => p.quiz_score !== null).length)
    }
  };

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Progress Report',
    defaultPath: `yourteacher-progress-${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (canceled) return { success: false, filePath: null };
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  return { success: true, filePath };
});

// -----------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------
app.whenReady().then(() => {
  getDb(); // initialize DB on startup
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (db) db.close();
  db = null;
  if (process.platform !== 'darwin') app.quit();
});
