// ============================================================
// events/interactionCreate.js — Tüm Interaction Yöneticisi
// ============================================================

const { handleSeferBaslat, handleKalkisSecim, handleVarisSecim, handleAracSecim, handleGeziToggle, handleTalepGonder } = require('../panels/seferBaslat');
const { handleOnayla, handleReddet } = require('../panels/seferOnay');
const { handleSeferBitir }           = require('../panels/seferBitis');

module.exports = async (interaction) => {
  try {
    // ── Buton İnteraksiyonları ───────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id === 'sefer_baslat')            return await handleSeferBaslat(interaction);
      if (id === 'sefer_bitir')             return await handleSeferBitir(interaction);
      if (id.startsWith('sefer_onayla__')) return await handleOnayla(interaction);
      if (id.startsWith('sefer_reddet__')) return await handleReddet(interaction);
      if (id.startsWith('sefer_gezi__'))   return await handleGeziToggle(interaction);
      if (id.startsWith('sefer_gonder__')) return await handleTalepGonder(interaction);
    }

    // ── Select Menu İnteraksiyonları ─────────────────────────
    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;

      if (id === 'sefer_kalkis')            return await handleKalkisSecim(interaction);
      if (id.startsWith('sefer_varis__'))  return await handleVarisSecim(interaction);
      if (id.startsWith('sefer_arac__'))   return await handleAracSecim(interaction);
    }
  } catch (err) {
    console.error('[INTERACTION ERROR]', err);

    // Hata durumunda kullanıcıya bilgi ver
    const msg = { content: '❌ Bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    } catch (_) {}
  }
};
