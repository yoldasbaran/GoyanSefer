// ============================================================
// commands/istatistik.js — !istatistik Komutu
// ============================================================

const config                  = require('../config');
const { readDB, getUserStats } = require('../utils/database');
const { profilEmbed }         = require('../utils/embeds');
const { hasAnyRole }          = require('../utils/helpers');

module.exports = async (message, args) => {
  const allowedRoles = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(message.member, allowedRoles)) {
    return message.reply('❌ Bu komutu kullanmak için **Yönetim** rolüne ihtiyacınız var.');
  }

  try {
    const target = message.mentions.members.first() || message.member;
    const db     = readDB();
    const stats  = getUserStats(db, target.id);

    await message.reply({ embeds: [profilEmbed(target, stats)] });
  } catch (err) {
    console.error('[İSTATİSTİK]', err);
    message.reply('❌ İstatistik getirilirken bir hata oluştu.');
  }
};
