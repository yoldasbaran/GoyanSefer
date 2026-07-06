// ============================================================
// commands/sefersifirlama.js — !sefersıfırlama Komutu
// ============================================================

const config           = require('../config');
const { readDB, writeDB } = require('../utils/database');
const { hasAnyRole }   = require('../utils/helpers');

module.exports = async (message) => {
  if (!hasAnyRole(message.member, [config.roles.yonetim])) {
    return message.reply('❌ Bu komutu yalnızca **Yönetim** rolüne sahip kişiler kullanabilir.');
  }

  const db = readDB();

  for (const userId in db.stats) {
    db.stats[userId] = {
      totalTours:   0,
      weeklyTours:  0,
      monthlyTours: 0,
      dailyTours:   0,
      lastTourAt:   null,
    };
  }

  writeDB(db);

  await message.reply('✅ Tüm sefer sayıları sıfırlandı.');
  console.log(`[SIFIRLA] ${message.author.username} sefer sayılarını sıfırladı.`);
};
