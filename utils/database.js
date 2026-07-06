// ============================================================
// utils/database.js — JSON Veritabanı Okuma / Yazma Yöneticisi
// ============================================================

const fs   = require('fs');
const path = require('path');
const config = require('../config');

const DB_PATH = path.resolve(config.dbPath);

const DEFAULT_DB = {
  activeTours:       {},
  pendingTours:      {},
  pendingSessions:   {},
  completedTours:    [],
  stats:             {},
  weeklyWarningDays: {},
  panels: {
    izinMessageId:  null,
    izinChannelId:  null,
    bitisMessageId: null,
    bitisChannelId: null,
  },
};

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(DEFAULT_DB);
      return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
    const raw    = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...JSON.parse(JSON.stringify(DEFAULT_DB)), ...parsed };
  } catch (err) {
    console.error('[DB] Okuma hatası:', err.message);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Yazma hatası:', err.message);
  }
}

function getUserStats(db, userId) {
  if (!db.stats[userId]) {
    db.stats[userId] = {
      totalTours:   0,
      weeklyTours:  0,
      monthlyTours: 0,
      dailyTours:   0,
      lastTourAt:   null,
    };
  }
  return db.stats[userId];
}

module.exports = { readDB, writeDB, getUserStats };
