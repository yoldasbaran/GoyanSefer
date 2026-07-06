// ============================================================
// panels/seferBaslat.js — Sefer Başlatma (4 Aşamalı Akış)
// ============================================================

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const config                      = require('../config');
const { readDB, writeDB }         = require('../utils/database');
const { onayBekleyenEmbed }       = require('../utils/embeds');
const { formatDateOnlyTR, formatTimeOnlyTR, canStartNewTour, formatDuration } = require('../utils/helpers');

function hourlyLimitMessage(remaining) {
  return `⏳ Saatte en fazla **1 sefer** yapabilirsiniz. Tekrar deneyebilmeniz için **${formatDuration(remaining)}** beklemeniz gerekiyor.`;
}

// ── Aşama 1: Kalkış Şehri Seçimi ─────────────────────────────
async function handleSeferBaslat(interaction) {
  const db = readDB();
  const userId = interaction.user.id;

  const limit = canStartNewTour(db, userId);
  if (!limit.ok) {
    return interaction.reply({
      content: hourlyLimitMessage(limit.remaining),
      ephemeral: true,
    });
  }

  if (db.activeTours[userId]) {
    return interaction.reply({
      content: '⚠️ Zaten **aktif bir seferiniz** bulunuyor. Önce mevcut seferinizi bitirmeniz gerekiyor.',
      ephemeral: true,
    });
  }

  if (db.pendingTours[userId]) {
    return interaction.reply({
      content: '⏳ Zaten **onay bekleyen bir talebiniz** var. Lütfen yönetimin onayını bekleyin.',
      ephemeral: true,
    });
  }

  const kalkisMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('sefer_kalkis')
      .setPlaceholder('Kalkış şehri seçin...')
      .addOptions(
        config.cities.map(city => ({
          label: city,
          value: city,
        }))
      )
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('SEFER BAŞLATMA — AŞAMA 1/3')
    .setDescription('**Kalkış şehrinizi** seçin.')
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  await interaction.reply({
    embeds: [embed],
    components: [kalkisMenu],
    ephemeral: true,
  });
}

// ── Aşama 2: Varış Şehri Seçimi ──────────────────────────────
async function handleKalkisSecim(interaction) {
  const kalkis = interaction.values[0];
  const varisList = config.cities.filter(c => c !== kalkis);

  const varisMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`sefer_varis__${kalkis}`)
      .setPlaceholder('Varış şehri seçin...')
      .addOptions(
        varisList.map(city => ({
          label: city,
          value: city,
        }))
      )
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('SEFER BAŞLATMA — AŞAMA 2/3')
    .setDescription(`✅ Kalkış: **${kalkis}**\n\n**Varış şehrinizi** seçin.`)
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  await interaction.update({
    embeds: [embed],
    components: [varisMenu],
  });
}

// ── Aşama 3: Araç Seçimi ──────────────────────────────────────
async function handleVarisSecim(interaction) {
  const kalkis = interaction.customId.split('__')[1];
  const varis  = interaction.values[0];

  const aracMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`sefer_arac__${kalkis}__${varis}`)
      .setPlaceholder('Araç (plaka) seçin...')
      .addOptions(
        config.vehicles.map(plaka => ({
          label: plaka,
          value: plaka,
        }))
      )
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('SEFER BAŞLATMA — AŞAMA 3/3')
    .setDescription(`✅ Kalkış: **${kalkis}**\n✅ Varış: **${varis}**\n\n**Aracınızı** seçin.`)
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  await interaction.update({
    embeds: [embed],
    components: [aracMenu],
  });
}

// ── Aşama 4: Gezi Seçeneği + Talep Gönder ─────────────────────
async function handleAracSecim(interaction) {
  const parts  = interaction.customId.split('__');
  const kalkis = parts[1];
  const varis  = parts[2];
  const arac   = interaction.values[0];
  const userId = interaction.user.id;

  const db = readDB();
  db.pendingSessions[userId] = {
    kalkis,
    varis,
    arac,
    sadeceGezi: false,
  };
  writeDB(db);

  await showOnayAdimi(interaction, userId);
}

function buildOnayComponents(userId, sadeceGezi) {
  const geziButon = new ButtonBuilder()
    .setCustomId(`sefer_gezi__${userId}`)
    .setLabel(sadeceGezi ? '☑ Sadece Gezeceğim' : '☐ Sadece Gezeceğim')
    .setStyle(sadeceGezi ? ButtonStyle.Primary : ButtonStyle.Secondary);

  const gonderButon = new ButtonBuilder()
    .setCustomId(`sefer_gonder__${userId}`)
    .setLabel('Talebi Gönder')
    .setStyle(ButtonStyle.Success);

  return [
    new ActionRowBuilder().addComponents(geziButon),
    new ActionRowBuilder().addComponents(gonderButon),
  ];
}

async function showOnayAdimi(interaction, userId, isUpdate = true) {
  const db = readDB();
  const session = db.pendingSessions[userId];

  if (!session) {
    const msg = { content: '❌ Oturum süresi doldu. Lütfen tekrar başlayın.', embeds: [], components: [] };
    return isUpdate ? interaction.update(msg) : interaction.reply({ ...msg, ephemeral: true });
  }

  const geziText = session.sadeceGezi ? '\n🗺️ **Sadece gezeceğim** seçildi.' : '';

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle('SEFER TALEBİ — ONAY')
    .setDescription(
      `🟢 Kalkış: **${session.kalkis}**\n` +
      `🔴 Varış: **${session.varis}**\n` +
      `🚗 Araç: \`${session.arac}\`${geziText}\n\n` +
      `İsterseniz alttaki kutucuktan **Sadece Gezeceğim** seçeneğini işaretleyin, ardından talebi gönderin.`
    )
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  const payload = {
    embeds: [embed],
    components: buildOnayComponents(userId, session.sadeceGezi),
  };

  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

async function handleGeziToggle(interaction) {
  const userId = interaction.customId.split('__')[1];
  if (interaction.user.id !== userId) {
    return interaction.reply({
      content: '❌ Bu seçenek yalnızca talebi oluşturan kişi tarafından değiştirilebilir.',
      ephemeral: true,
    });
  }

  const db = readDB();
  const session = db.pendingSessions[userId];
  if (!session) {
    return interaction.reply({
      content: '❌ Oturum süresi doldu. Lütfen tekrar başlayın.',
      ephemeral: true,
    });
  }

  session.sadeceGezi = !session.sadeceGezi;
  writeDB(db);

  await showOnayAdimi(interaction, userId);
}

// ── Talep Oluşturma — Onay Kanalına Gönder ────────────────────
async function handleTalepGonder(interaction) {
  const userId = interaction.customId.split('__')[1];
  if (interaction.user.id !== userId) {
    return interaction.reply({
      content: '❌ Bu butonu yalnızca talebi oluşturan kişi kullanabilir.',
      ephemeral: true,
    });
  }

  const db = readDB();
  const session = db.pendingSessions[userId];

  if (!session) {
    return interaction.update({
      content: '❌ Oturum süresi doldu. Lütfen tekrar başlayın.',
      embeds: [],
      components: [],
    });
  }

  const limit = canStartNewTour(db, userId);
  if (!limit.ok) {
    return interaction.update({
      content: hourlyLimitMessage(limit.remaining),
      embeds: [],
      components: [],
    });
  }

  const { kalkis, varis, arac, sadeceGezi } = session;
  const user   = interaction.user;
  const now    = new Date();
  const tarih  = formatDateOnlyTR(now);
  const saat   = formatTimeOnlyTR(now);

  const onayChannel = interaction.guild.channels.cache.get(config.channels.seferOnay);
  if (!onayChannel) {
    return interaction.update({
      content: '❌ Onay kanalı bulunamadı.',
      embeds: [],
      components: [],
    });
  }

  const butonlar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sefer_onayla__${user.id}`)
      .setLabel('✅ Onayla')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`sefer_reddet__${user.id}`)
      .setLabel('❌ Reddet')
      .setStyle(ButtonStyle.Danger),
  );

  const embed = onayBekleyenEmbed({ user, kalkis, varis, arac, tarih, saat, sadeceGezi });

  const onayMsg = await onayChannel.send({
    content: `<@&${config.roles.yonetim}> <@&${config.roles.genelMudur}>`,
    embeds: [embed],
    components: [butonlar],
  });

  db.pendingTours[user.id] = {
    userId:     user.id,
    username:   user.username,
    kalkis,
    varis,
    arac,
    sadeceGezi: !!sadeceGezi,
    tarih,
    saat,
    timestamp:  now.toISOString(),
    onayMsgId:  onayMsg.id,
  };
  delete db.pendingSessions[userId];
  writeDB(db);

  const successEmbed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('✅  TALEBİNİZ İLETİLDİ')
    .setDescription(
      `Sefer talebiniz **yönetim onayına** gönderildi.\n\n` +
      `🟢 Kalkış: **${kalkis}**\n` +
      `🔴 Varış: **${varis}**\n` +
      `🚗 Araç: \`${arac}\`\n` +
      (sadeceGezi ? `🗺️ **Sadece gezeceğim**\n\n` : '\n') +
      `⏳ Onay bekleniyor...`
    )
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  await interaction.update({
    embeds: [successEmbed],
    components: [],
  });

  console.log(`[TALEP] ${user.username} sefer talebi oluşturdu → ${kalkis} → ${varis} (${arac})${sadeceGezi ? ' [Gezi]' : ''}`);
}

module.exports = {
  handleSeferBaslat,
  handleKalkisSecim,
  handleVarisSecim,
  handleAracSecim,
  handleGeziToggle,
  handleTalepGonder,
};
