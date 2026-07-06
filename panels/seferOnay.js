// ============================================================
// panels/seferOnay.js — Sefer Onay / Red İşlemleri
// ============================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config                      = require('../config');
const { readDB, writeDB, getUserStats } = require('../utils/database');
const { hasAnyRole }              = require('../utils/helpers');

// ── Onay İşlemi ───────────────────────────────────────────────
async function handleOnayla(interaction) {
  // Yetki kontrolü
  const approverRoleIds = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(interaction.member, approverRoleIds)) {
    return interaction.reply({
      content: '❌ Bu butonu kullanmak için **Yönetim** veya **Genel Müdür** rolüne sahip olmanız gerekiyor.',
      ephemeral: true,
    });
  }

  // customId: sefer_onayla__userId
  const targetUserId = interaction.customId.split('__')[1];
  const db = readDB();
  const pending = db.pendingTours[targetUserId];

  if (!pending) {
    return interaction.reply({
      content: '⚠️ Bu talep artık geçerli değil veya zaten işleme alındı.',
      ephemeral: true,
    });
  }

  const now = new Date();

  // Aktif sefere al
  db.activeTours[targetUserId] = {
    ...pending,
    baslangic:  now.toISOString(),
    onaylayan:  interaction.user.id,
    onaylayanUsername: interaction.user.username,
  };

  // Bekleyenlerden sil
  delete db.pendingTours[targetUserId];
  writeDB(db);

  // Onay mesajını güncelle (butonları kapat)
  const onayliEmbed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('✅  SEFER ONAYLANDI')
    .setDescription(
      `<@${targetUserId}> kullanıcısının sefer talebi **onaylandı**.\n\n` +
      `🟢 Kalkış: **${pending.kalkis}**\n` +
      `🔴 Varış: **${pending.varis}**\n` +
      `🚛 Araç: \`${pending.arac}\`\n` +
      `✅ Onaylayan: <@${interaction.user.id}>`
    )
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
    .setTimestamp();

  await interaction.update({
    content: '',
    embeds: [onayliEmbed],
    components: [],
  });

  // Kullanıcıya DM veya kanal mesajı gönder
  try {
    const targetUser = await interaction.guild.members.fetch(targetUserId);
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle('✅  SEFER TALEBİNİZ ONAYLANDI')
          .setDescription(
            `**${interaction.user.username}** tarafından sefer talebiniz onaylandı.\n\n` +
            `🟢 Kalkış: **${pending.kalkis}**\n` +
            `🔴 Varış: **${pending.varis}**\n` +
            `🚛 Araç: \`${pending.arac}\`\n\n` +
            `İyi yolculuklar! Seferiniz bittiğinde **#sefer-bitiş** kanalından bildirin.`
          )
          .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
          .setTimestamp()
      ],
    });
  } catch (_) { /* DM kapalı olabilir, sorun değil */ }

  console.log(`[ONAY] ${pending.username} seferi onaylandı → ${pending.kalkis} → ${pending.varis}`);
}

// ── Red İşlemi ────────────────────────────────────────────────
async function handleReddet(interaction) {
  // Yetki kontrolü
  const approverRoleIds = [config.roles.yonetim, config.roles.genelMudur];
  if (!hasAnyRole(interaction.member, approverRoleIds)) {
    return interaction.reply({
      content: '❌ Bu butonu kullanmak için **Yönetim** veya **Genel Müdür** rolüne sahip olmanız gerekiyor.',
      ephemeral: true,
    });
  }

  const targetUserId = interaction.customId.split('__')[1];
  const db = readDB();
  const pending = db.pendingTours[targetUserId];

  if (!pending) {
    return interaction.reply({
      content: '⚠️ Bu talep artık geçerli değil veya zaten işleme alındı.',
      ephemeral: true,
    });
  }

  // Bekleyenlerden sil
  delete db.pendingTours[targetUserId];
  writeDB(db);

  // Mesajı güncelle
  const reddedildiEmbed = new EmbedBuilder()
    .setColor(config.colors.danger)
    .setTitle('❌  SEFER REDDEDİLDİ')
    .setDescription(
      `<@${targetUserId}> kullanıcısının sefer talebi **reddedildi**.\n\n` +
      `🟢 Kalkış: **${pending.kalkis}**\n` +
      `🔴 Varış: **${pending.varis}**\n` +
      `🚛 Araç: \`${pending.arac}\`\n` +
      `❌ Reddeden: <@${interaction.user.id}>`
    )
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
    .setTimestamp();

  await interaction.update({
    content: '',
    embeds: [reddedildiEmbed],
    components: [],
  });

  // Kullanıcıya DM gönder
  try {
    const targetUser = await interaction.guild.members.fetch(targetUserId);
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.danger)
          .setTitle('❌  SEFER TALEBİNİZ REDDEDİLDİ')
          .setDescription(
            `Sefer talebiniz **${interaction.user.username}** tarafından reddedildi.\n\n` +
            `🟢 Kalkış: **${pending.kalkis}** | 🔴 Varış: **${pending.varis}**\n\n` +
            `Yeniden başvurabilirsiniz.`
          )
          .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
          .setTimestamp()
      ],
    });
  } catch (_) { /* DM kapalı */ }

  console.log(`[RED] ${pending.username} seferi reddedildi.`);
}

module.exports = { handleOnayla, handleReddet };
