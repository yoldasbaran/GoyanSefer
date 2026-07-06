// ============================================================
// utils/helpers.js — Yardımcı Fonksiyonlar
// ============================================================

const config = require('../config');

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours        = Math.floor(totalSeconds / 3600);
  const minutes      = Math.floor((totalSeconds % 3600) / 60);
  const seconds      = totalSeconds % 60;
  const parts = [];
  if (hours   > 0) parts.push(`${hours} saat`);
  if (minutes > 0) parts.push(`${minutes} dakika`);
  if (seconds > 0) parts.push(`${seconds} saniye`);
  return parts.length > 0 ? parts.join(' ') : '0 saniye';
}

function formatDateTR(date = new Date()) {
  return date.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

function formatDateOnlyTR(date = new Date()) {
  return date.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

function formatTimeOnlyTR(date = new Date()) {
  return date.toLocaleTimeString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour:     '2-digit',
    minute:   '2-digit',
  });
}

function hasAnyRole(member, roleIds = []) {
  return roleIds.some(id => member.roles.cache.has(id));
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function canStartNewTour(db, userId) {
  const stats = db.stats[userId];
  if (!stats?.lastTourAt) return { ok: true };

  const elapsed = Date.now() - new Date(stats.lastTourAt).getTime();
  if (elapsed < config.hourlyTourLimitMs) {
    return { ok: false, remaining: config.hourlyTourLimitMs - elapsed };
  }
  return { ok: true };
}

module.exports = {
  formatDuration,
  formatDateTR,
  formatDateOnlyTR,
  formatTimeOnlyTR,
  hasAnyRole,
  capitalize,
  canStartNewTour,
};
