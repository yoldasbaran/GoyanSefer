// ============================================================
// panels/seferBitis.js — Sefer Bitirme İşlemi
// ============================================================

const { EmbedBuilder } = require('discord.js');
const config                              = require('../config');
const { readDB, writeDB, getUserStats }   = require('../utils/database');
const { seferLogEmbed }                   = require('../utils/embeds');
const { formatDuration }                  = require('../utils/helpers');

async function handleSeferBitir(interaction) {
  const db     = readDB();
  const userId = interaction.user.id;
  const active = db.activeTours[userId];

  // Aktif sefer yoksa uyar
  if (!active) {
    return interaction.reply({
      content: '⚠️ Şu anda **aktif bir seferiniz** bulunmuyor.',
      ephemeral: true,
    });
  }

  const now      = new Date();
  const baslangic = new Date(active.baslangic);
  const sureMilis = now.getTime() - baslangic.getTime();
  const sureText  = formatDuration(sureMilis);

  // Onaylayan kullanıcıyı bul
  let onaylayan;
  try {
    onaylayan = await interaction.guild.members.fetch(active.onaylayan);
    onaylayan = onaylayan.user;
  } catch {
    onaylayan = { id: active.onaylayan, username: 'Bilinmiyor' };
  }

  // Kullanıcı objesini oluştur
  const user = interaction.user;

  // Seferi tamamlanmış kayıtlara ekle
  const completedRecord = {
    userId:             userId,
    username:           user.username,
    kalkis:             active.kalkis,
    varis:              active.varis,
    arac:               active.arac,
    baslangic:          active.baslangic,
    bitis:              now.toISOString(),
    sure:               sureText,
    sureMilis,
    onaylayan:          active.onaylayan,
    onaylayanUsername:  onaylayan.username,
  };

  db.completedTours.push(completedRecord);

  // İstatistikleri güncelle
  const stats = getUserStats(db, userId);
  stats.totalTours   += 1;
  stats.weeklyTours  += 1;
  stats.monthlyTours += 1;
  stats.dailyTours   += 1;

  // Aktif seferden kaldır
  delete db.activeTours[userId];
  writeDB(db);

  // Log kanalına embed gönder
  const logChannel = interaction.guild.channels.cache.get(config.channels.seferLog);
  if (logChannel) {
    await logChannel.send({
      embeds: [
        seferLogEmbed({
          user,
          kalkis:    active.kalkis,
          varis:     active.varis,
          arac:      active.arac,
          baslangic: active.baslangic,
          bitis:     now.toISOString(),
          sure:      sureText,
          onaylayan,
        }),
      ],
    });
  }

  // Kullanıcıya ephemeral mesaj
  await interaction.reply({
    content: '✅ **Seferiniz başarıyla sisteme kaydedildi.**\nToplam sürünüz: **' + sureText + '**',
    ephemeral: true,
  });

  console.log(`[BİTİŞ] ${user.username} seferini tamamladı → Süre: ${sureText}`);
}

module.exports = { handleSeferBitir };
