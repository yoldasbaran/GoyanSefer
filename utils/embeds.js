// ============================================================
// utils/embeds.js — GOYAN GROUP Embed Şablonları
// ============================================================

const { EmbedBuilder } = require('discord.js');
const config           = require('../config');
const { formatDuration, formatDateTR, formatTimeOnlyTR } = require('./helpers');

// ── Sefer İzin Paneli Embed ───────────────────────────────────
function izinPanelEmbed() {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🚛  GOYAN GROUP — SEFER İZİN PANELİ')
    .setDescription(
      '>>> Sefere çıkmadan önce aşağıdaki butona basarak **sefer başlatabilirsiniz**.\n\n' +
      '⚠️ Aynı anda yalnızca **bir aktif seferiniz** olabilir.\n' +
      '📋 Talebiniz yönetim tarafından onaylandıktan sonra sefer başlar.'
    )
    .addFields(
      { name: '📌 Dikkat', value: 'Aynı kalkış ve varış şehri **seçilemez**.', inline: false }
    )
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi • Sürüm 2.0' })
    .setTimestamp();
}

// ── Sefer Bitiş Paneli Embed ─────────────────────────────────
function bitisPanelEmbed() {
  return new EmbedBuilder()
    .setColor(config.colors.danger)
    .setTitle('🛑  GOYAN GROUP — SEFER BİTİRME PANELİ')
    .setDescription(
      '>>> Aktif seferinizi tamamladıktan sonra aşağıdaki butona basarak **seferinizi bitirebilirsiniz**.\n\n' +
      '⏱️ Toplam süreniz otomatik olarak hesaplanır ve **sefer-log** kanalına kaydedilir.'
    )
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi • Sürüm 2.0' })
    .setTimestamp();
}

// ── Onay Bekleyen Sefer Embed'i ───────────────────────────────
function onayBekleyenEmbed({ user, kalkis, varis, arac, tarih, saat }) {
  return new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle('📋  YENİ SEFER TALEBİ')
    .setDescription(`<@&${config.roles.yonetim}> <@&${config.roles.genelMudur}>\nYeni bir sefer talebi onay bekliyor.`)
    .addFields(
      { name: '👤 Personel',  value: `<@${user.id}>`,  inline: true },
      { name: '🟢 Kalkış',   value: `**${kalkis}**`,  inline: true },
      { name: '🔴 Varış',    value: `**${varis}**`,   inline: true },
      { name: '🚛 Araç',     value: `\`${arac}\``,    inline: true },
      { name: '📅 Tarih',    value: tarih,            inline: true },
      { name: '🕐 Saat',     value: saat,             inline: true },
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
    .setTimestamp();
}

// ── Sefer Log Embed'i ─────────────────────────────────────────
function seferLogEmbed({ user, kalkis, varis, arac, baslangic, bitis, sure, onaylayan }) {
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('✅  SEFER TAMAMLANDI')
    .setDescription(`**${user.username}** adlı personelin seferi başarıyla tamamlandı.`)
    .addFields(
      { name: '👤 Şoför',         value: `<@${user.id}>`,              inline: true },
      { name: '🟢 Kalkış',        value: `**${kalkis}**`,              inline: true },
      { name: '🔴 Varış',         value: `**${varis}**`,               inline: true },
      { name: '🚛 Araç',          value: `\`${arac}\``,                inline: true },
      { name: '⏱️ Toplam Süre',   value: `**${sure}**`,                inline: true },
      { name: '✅ Onaylayan',      value: `<@${onaylayan.id}>`,         inline: true },
      { name: '🕐 Başlangıç',     value: formatDateTR(new Date(baslangic)), inline: true },
      { name: '🏁 Bitiş',         value: formatDateTR(new Date(bitis)),     inline: true },
      { name: '📅 Tarih',         value: new Date(bitis).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }), inline: true },
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi • Tamamlandı' })
    .setTimestamp();
}

// ── Profil Embed'i ────────────────────────────────────────────
function profilEmbed(member, stats) {
  const user = member.user;
  return new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle(`🪪  PERSONEL PROFİLİ`)
    .setDescription(`**${user.username}** kullanıcısına ait sefer özeti`)
    .addFields(
      { name: '📊 Toplam Sefer',   value: `**${stats.totalTours}**`,   inline: true },
      { name: '📅 Haftalık Sefer', value: `**${stats.weeklyTours}**`,  inline: true },
      { name: '🗓️ Aylık Sefer',   value: `**${stats.monthlyTours}**`, inline: true },
      { name: '🌅 Günlük Sefer',  value: `**${stats.dailyTours}**`,   inline: true },
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
    .setTimestamp();
}

// ── İstatistik Sıralama Embed'i ───────────────────────────────
function siralamaEmbed(rows, tip = 'Toplam') {
  const description = rows.length === 0
    ? 'Henüz sefer kaydı bulunmuyor.'
    : rows.map((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
        return `${medal} <@${r.userId}> — **${r.count} sefer**`;
      }).join('\n');

  return new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(`🏆  SEFER SIRALAMASI — ${tip.toUpperCase()}`)
    .setDescription(description)
    .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
    .setTimestamp();
}

// ── Haftalık Rapor DM Embed'i ─────────────────────────────────
function haftalikRaporEmbed(stats, completedTours) {
  const now        = new Date();
  const weekStart  = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);

  const weeklyTours = completedTours.filter(t => {
    const d = new Date(t.bitis);
    return d >= weekStart && d <= now;
  });

  const totalWeekly   = weeklyTours.length;
  const dailyAvg      = (totalWeekly / 7).toFixed(1);
  const uniqueDrivers = new Set(weeklyTours.map(t => t.userId)).size;

  const topDrivers = Object.entries(stats)
    .sort((a, b) => b[1].weeklyTours - a[1].weeklyTours)
    .slice(0, 5)
    .map(([uid, s], i) => `${i + 1}. <@${uid}> — ${s.weeklyTours} sefer`)
    .join('\n') || 'Veri yok';

  return new EmbedBuilder()
    .setColor(config.colors.purple)
    .setTitle('📊  GOYAN GROUP — HAFTALIK SEFER RAPORU')
    .setDescription(`**${weekStart.toLocaleDateString('tr-TR')} – ${now.toLocaleDateString('tr-TR')}** dönemi raporu`)
    .addFields(
      { name: '🚛 Toplam Sefer',      value: `**${totalWeekly}**`,      inline: true },
      { name: '📈 Günlük Ortalama',   value: `**${dailyAvg}**`,         inline: true },
      { name: '👥 Aktif Sürücü',      value: `**${uniqueDrivers}**`,    inline: true },
      { name: '🏆 En Çok Sefer',      value: topDrivers,                inline: false },
    )
    .setFooter({ text: 'Bu rapor otomatik oluşturulmuştur. Veriler sıfırlanmıştır.' })
    .setTimestamp();
}

module.exports = {
  izinPanelEmbed,
  bitisPanelEmbed,
  onayBekleyenEmbed,
  seferLogEmbed,
  profilEmbed,
  siralamaEmbed,
  haftalikRaporEmbed,
};
