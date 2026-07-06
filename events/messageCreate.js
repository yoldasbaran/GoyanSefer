// ============================================================
// events/messageCreate.js — Prefix (!komut) Yöneticisi
// ============================================================

const config    = require('../config');
const kurulum   = require('../panels/kurulum');
const profil    = require('../commands/profil');
const istatistik = require('../commands/istatistik');
const sefersiralama = require('../commands/sefersiralama');
const sefersifirlama = require('../commands/sefersifirlama');
const { handleUyari1, handleUyari2 } = require('../commands/seferuyari');

module.exports = async (message) => {
  // Bot mesajlarını ve prefix'siz mesajları yoksay
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args    = message.content.slice(config.prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  try {
    switch (command) {
      case 'kurulum':
        return await kurulum(message);

      case 'profil':
        return await profil(message, args);

      case 'istatistik':
        return await istatistik(message, args);

      // Türkçe karakter varyantlarını da yakala
      case 'sefersıralama':
      case 'sefersiralama':
        return await sefersiralama(message, args);

      case 'seferuyarı1':
      case 'seferuyari1':
        return await handleUyari1(message);

      case 'seferuyarı2':
      case 'seferuyari2':
        return await handleUyari2(message);

      case 'sefersıfırlama':
      case 'sefersifirlama':
        return await sefersifirlama(message);

      default:
        // Bilinmeyen komutlara sessiz kal
        break;
    }
  } catch (err) {
    console.error(`[KOMUT HATA] ${command}:`, err);
    message.reply('❌ Komut işlenirken bir hata oluştu.').catch(() => {});
  }
};
