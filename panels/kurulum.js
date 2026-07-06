// ============================================================
// panels/kurulum.js — !kurulum Komut Panellerini Gönderir
// ============================================================

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const config                          = require('../config');
const { readDB, writeDB }             = require('../utils/database');
const { izinPanelEmbed, bitisPanelEmbed } = require('../utils/embeds');
const { hasAnyRole }                  = require('../utils/helpers');

module.exports = async (message) => {
  // ── Yetki Kontrolü ────────────────────────────────────────
  const setupRoleIds = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(message.member, setupRoleIds)) {
    return message.reply({
      content: '❌ Bu komutu kullanmak için **Yönetim** veya **Genel Müdür** rolüne sahip olmanız gerekiyor.',
      ephemeral: true,
    }).catch(() => {});
  }

  const guild = message.guild;

  // ── Kanalları Bul ─────────────────────────────────────────
  const izinChannel  = guild.channels.cache.get(config.channels.seferIzin);
  const bitisChannel = guild.channels.cache.get(config.channels.seferBitis);

  if (!izinChannel || !bitisChannel) {
    return message.reply('❌ Sefer kanalları bulunamadı. Lütfen kanal ID\'lerini `config.js` içinde kontrol edin.');
  }

  try {
    // ── Sefer Başlat Butonu ───────────────────────────────────
    const baslatButon = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sefer_baslat')
        .setLabel('Sefer Başlat')
        .setStyle(ButtonStyle.Success)
    );

    // ── Seferi Bitir Butonu ───────────────────────────────────
    const bitirButon = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sefer_bitir')
        .setLabel('🛑 Seferi Bitir')
        .setStyle(ButtonStyle.Danger)
    );

    // ── Panelleri Gönder ──────────────────────────────────────
    const izinMsg  = await izinChannel.send({ embeds: [izinPanelEmbed()],  components: [baslatButon] });
    const bitisMsg = await bitisChannel.send({ embeds: [bitisPanelEmbed()], components: [bitirButon] });

    // ── Panel ID'lerini Veritabanına Kaydet ───────────────────
    const db = readDB();
    db.panels.izinMessageId  = izinMsg.id;
    db.panels.izinChannelId  = izinChannel.id;
    db.panels.bitisMessageId = bitisMsg.id;
    db.panels.bitisChannelId = bitisChannel.id;
    writeDB(db);

    // ── Başarı Mesajı ─────────────────────────────────────────
    await message.reply(
      `✅ Paneller başarıyla oluşturuldu!\n` +
      `📌 İzin Paneli → <#${izinChannel.id}>\n` +
      `📌 Bitiş Paneli → <#${bitisChannel.id}>`
    );

    console.log(`[KURULUM] Paneller oluşturuldu. İzin: ${izinMsg.id} | Bitiş: ${bitisMsg.id}`);
  } catch (err) {
    console.error('[KURULUM] Hata:', err);
    message.reply('❌ Paneller oluşturulurken bir hata oluştu. Konsolu kontrol edin.');
  }
};
