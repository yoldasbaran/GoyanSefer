// ============================================================
// panels/seferBaslat.js — Sefer Başlatma (3 Aşamalı Select Menu)
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
const { formatDateOnlyTR, formatTimeOnlyTR } = require('../utils/helpers');

// ── Aşama 1: Kalkış Şehri Seçimi ─────────────────────────────
async function handleSeferBaslat(interaction) {
  const db = readDB();

  // Zaten aktif seferi var mı?
  if (db.activeTours[interaction.user.id]) {
    return interaction.reply({
      content: '⚠️ Zaten **aktif bir seferiniz** bulunuyor. Önce mevcut seferinizi bitirmeniz gerekiyor.',
      ephemeral: true,
    });
  }

  // Onay bekleyen talebi var mı?
  if (db.pendingTours[interaction.user.id]) {
    return interaction.reply({
      content: '⏳ Zaten **onay bekleyen bir talebiniz** var. Lütfen yönetimin onayını bekleyin.',
      ephemeral: true,
    });
  }

  // Kalkış şehri select menu
  const kalkisMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('sefer_kalkis')
      .setPlaceholder('🟢 Kalkış şehri seçin...')
      .addOptions(
        config.cities.map(city => ({
          label: city,
          value: city,
          emoji: city === 'Gezi' ? '🗺️' : '🏙️',
        }))
      )
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🚛  SEFER BAŞLATMA — AŞAMA 1/3')
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

  // Aynı şehir seçilemesin diye kalkışı filtrele
  const varisList = config.cities.filter(c => c !== kalkis);

  const varisMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`sefer_varis__${kalkis}`)
      .setPlaceholder('🔴 Varış şehri seçin...')
      .addOptions(
        varisList.map(city => ({
          label: city,
          value: city,
          emoji: city === 'Gezi' ? '🗺️' : '🏙️',
        }))
      )
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🚛  SEFER BAŞLATMA — AŞAMA 2/3')
    .setDescription(`✅ Kalkış: **${kalkis}**\n\n**Varış şehrinizi** seçin.`)
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  await interaction.update({
    embeds: [embed],
    components: [varisMenu],
  });
}

// ── Aşama 3: Araç Seçimi ──────────────────────────────────────
async function handleVarisSecim(interaction) {
  // customId formatı: sefer_varis__Niğde
  const kalkis = interaction.customId.split('__')[1];
  const varis  = interaction.values[0];

  const aracMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`sefer_arac__${kalkis}__${varis}`)
      .setPlaceholder('🚛 Araç (plaka) seçin...')
      .addOptions(
        config.vehicles.map(plaka => ({
          label: plaka,
          value: plaka,
          emoji: '🚚',
        }))
      )
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🚛  SEFER BAŞLATMA — AŞAMA 3/3')
    .setDescription(`✅ Kalkış: **${kalkis}**\n✅ Varış: **${varis}**\n\n**Aracınızı** seçin.`)
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  await interaction.update({
    embeds: [embed],
    components: [aracMenu],
  });
}

// ── Talep Oluşturma — Onay Kanalına Gönder ────────────────────
async function handleAracSecim(interaction) {
  // customId formatı: sefer_arac__Niğde__Adana
  const parts  = interaction.customId.split('__');
  const kalkis = parts[1];
  const varis  = parts[2];
  const arac   = interaction.values[0];
  const user   = interaction.user;
  const now    = new Date();
  const tarih  = formatDateOnlyTR(now);
  const saat   = formatTimeOnlyTR(now);

  // Onay kanalını bul
  const onayChannel = interaction.guild.channels.cache.get(config.channels.seferOnay);
  if (!onayChannel) {
    return interaction.update({
      content: '❌ Onay kanalı bulunamadı.',
      embeds: [],
      components: [],
    });
  }

  // Onayla / Reddet butonları
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

  // Embed'i oluştur
  const embed = onayBekleyenEmbed({ user, kalkis, varis, arac, tarih, saat });

  // Onay kanalına gönder
  const onayMsg = await onayChannel.send({
    content: `<@&${config.roles.yonetim}> <@&${config.roles.genelMudur}>`,
    embeds: [embed],
    components: [butonlar],
  });

  // Talebi veritabanına kaydet
  const db = readDB();
  db.pendingTours[user.id] = {
    userId:     user.id,
    username:   user.username,
    kalkis,
    varis,
    arac,
    tarih,
    saat,
    timestamp:  now.toISOString(),
    onayMsgId:  onayMsg.id,
  };
  writeDB(db);

  // Kullanıcıya bilgi ver
  const successEmbed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('✅  TALEBİNİZ İLETİLDİ')
    .setDescription(
      `Sefer talebiniz **yönetim onayına** gönderildi.\n\n` +
      `🟢 Kalkış: **${kalkis}**\n` +
      `🔴 Varış: **${varis}**\n` +
      `🚛 Araç: \`${arac}\`\n\n` +
      `⏳ Onay bekleniyor...`
    )
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' });

  await interaction.update({
    embeds: [successEmbed],
    components: [],
  });

  console.log(`[TALEP] ${user.username} sefer talebi oluşturdu → ${kalkis} → ${varis} (${arac})`);
}

module.exports = {
  handleSeferBaslat,
  handleKalkisSecim,
  handleVarisSecim,
  handleAracSecim,
};
