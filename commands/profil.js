// ============================================================
// commands/profil.js — !profil Komutu
// ============================================================

const config                  = require('../config');
const { readDB, getUserStats } = require('../utils/database');
const { profilEmbed }         = require('../utils/embeds');
const { hasAnyRole }          = require('../utils/helpers');

module.exports = async (message, args) => {
  // Sadece Yönetim rolü
  const allowedRoles = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(message.member, allowedRoles)) {
    return message.reply('❌ Bu komutu kullanmak için **Yönetim** rolüne ihtiyacınız var.');
  }

  try {
    // Etiketlenen kullanıcıyı veya kendini al
    const target = message.mentions.members.first() || message.member;
    const db     = readDB();
    const stats  = getUserStats(db, target.id);

    await message.reply({ embeds: [profilEmbed(target, stats)] });
  } catch (err) {
    console.error('[PROFIL]', err);
    message.reply('❌ Profil getirilirken bir hata oluştu.');
  }
};
