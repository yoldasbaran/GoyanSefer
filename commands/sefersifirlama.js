// ============================================================
// commands/sefersiralama.js — !sefersıralama Komutu
// ============================================================

const config             = require('../config');
const { readDB }         = require('../utils/database');
const { siralamaEmbed }  = require('../utils/embeds');
const { hasAnyRole }     = require('../utils/helpers');

module.exports = async (message, args) => {
  const allowedRoles = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(message.member, allowedRoles)) {
    return message.reply('❌ Bu komutu kullanmak için **Yönetim** rolüne ihtiyacınız var.');
  }

  try {
    // args[0]: haftalik | aylik | gunluk | varsayılan = toplam
    const tip = (args[0] || 'toplam').toLowerCase();
    const db  = readDB();

    let key;
    let label;
    switch (tip) {
      case 'haftalik':
      case 'haftalık':
        key   = 'weeklyTours';
        label = 'Haftalık';
        break;
      case 'aylik':
      case 'aylık':
        key   = 'monthlyTours';
        label = 'Aylık';
        break;
      case 'gunluk':
      case 'günlük':
        key   = 'dailyTours';
        label = 'Günlük';
        break;
      default:
        key   = 'totalTours';
        label = 'Toplam';
    }

    // Sırala
    const rows = Object.entries(db.stats)
      .map(([userId, s]) => ({ userId, count: s[key] || 0 }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    await message.reply({ embeds: [siralamaEmbed(rows, label)] });
  } catch (err) {
    console.error('[SIRALAMA]', err);
    message.reply('❌ Sıralama getirilirken bir hata oluştu.');
  }
};
