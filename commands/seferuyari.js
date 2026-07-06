// ============================================================
// commands/seferuyari.js — !seferuyarı1 ve !seferuyarı2 Komutları
// ============================================================

const { EmbedBuilder } = require('discord.js');
const config           = require('../config');
const { hasAnyRole }   = require('../utils/helpers');

// ── !seferuyarı1 @kullanıcı ──────────────────────────────────
async function handleUyari1(message) {
  const allowedRoles = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(message.member, allowedRoles)) {
    return message.reply('❌ Bu komutu kullanmak için **Yönetim** rolüne ihtiyacınız var.');
  }

  const target = message.mentions.members.first();
  if (!target) {
    return message.reply('❌ Kullanım: `!seferuyarı1 @kullanıcı`');
  }

  try {
    const uyariChannel = message.guild.channels.cache.get(config.channels.seferUyari);
    if (!uyariChannel) return message.reply('❌ Sefer-uyarı kanalı bulunamadı.');

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('⚠️  1. SEVİYE UYARI')
      .setDescription(
        `<@&${config.roles.sofor}>\n\n` +
        `<@${target.id}> **günlük minimum sefer sayısına ulaşamamıştır.**\n\n` +
        `📌 Günlük minimum: **${config.warning.dailyMinTours} sefer**\n\n` +
        `Lütfen sefer sayınızı artırın. Bu durum devam ederse ek yaptırım uygulanacaktır.`
      )
      .setFooter({ text: `Uyarı veren: ${message.author.username} • GOYAN GROUP` })
      .setTimestamp();

    await uyariChannel.send({ content: `<@${target.id}>`, embeds: [embed] });
    await message.reply(`✅ <@${target.id}> kullanıcısına **1. seviye uyarı** gönderildi.`);
  } catch (err) {
    console.error('[UYARI1]', err);
    message.reply('❌ Uyarı gönderilirken bir hata oluştu.');
  }
}

// ── !seferuyarı2 @kullanıcı ──────────────────────────────────
async function handleUyari2(message) {
  const allowedRoles = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(message.member, allowedRoles)) {
    return message.reply('❌ Bu komutu kullanmak için **Yönetim** rolüne ihtiyacınız var.');
  }

  const target = message.mentions.members.first();
  if (!target) {
    return message.reply('❌ Kullanım: `!seferuyarı2 @kullanıcı`');
  }

  try {
    const uyariChannel = message.guild.channels.cache.get(config.channels.seferUyari);
    if (!uyariChannel) return message.reply('❌ Sefer-uyarı kanalı bulunamadı.');

    const embed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setTitle('🚨  2. SEVİYE UYARI')
      .setDescription(
        `<@&${config.roles.yonetim}> <@&${config.roles.genelMudur}>\n\n` +
        `<@${target.id}> **tekrar eden sefer ihlali nedeniyle 2. seviye uyarı almıştır.**\n\n` +
        `📌 Bu kullanıcı için yönetim değerlendirmesi gerekebilir.`
      )
      .setFooter({ text: `Uyarı veren: ${message.author.username} • GOYAN GROUP` })
      .setTimestamp();

    await uyariChannel.send({
      content: `<@&${config.roles.yonetim}> <@${target.id}>`,
      embeds: [embed],
    });
    await message.reply(`✅ <@${target.id}> kullanıcısına **2. seviye uyarı** gönderildi.`);
  } catch (err) {
    console.error('[UYARI2]', err);
    message.reply('❌ Uyarı gönderilirken bir hata oluştu.');
  }
}

module.exports = { handleUyari1, handleUyari2 };
