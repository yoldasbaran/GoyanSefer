// ============================================================
// events/ready.js — Bot Hazır Event + Cron Görevleri
// ============================================================

const cron             = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const config           = require('../config');
const { readDB, writeDB, getUserStats } = require('../utils/database');
const { haftalikRaporEmbed }            = require('../utils/embeds');

module.exports = async (client) => {
  console.log(`\n✅ Bot aktif: ${client.user.tag}`);
  console.log(`📡 Bağlı sunucu sayısı: ${client.guilds.cache.size}`);
  console.log(`⏰ Türkiye saati: ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}\n`);

  // Bot durum mesajı
  client.user.setPresence({
    activities: [{ name: 'GOYAN GROUP • Sefer Sistemi', type: 0 }],
    status: 'online',
  });

  // ── Günlük Uyarı Kontrolü (Hafta içi 23:00 TR = 20:00 UTC) ──
  cron.schedule(config.warning.cronSchedule, async () => {
    console.log('[CRON] Günlük sefer uyarı kontrolü başlıyor...');
    await gundlukUyariKontrol(client);
  });

  // ── Haftalık Rapor (Pazar 23:00 TR = 20:00 UTC) ──────────────
  cron.schedule(config.warning.weeklyCron, async () => {
    console.log('[CRON] Haftalık rapor gönderiliyor...');
    await haftalikRaporGonder(client);
  });

  // ── Pazartesi Sıfırlama (Pazar 00:00 TR → 21:00 UTC) ─────────
  cron.schedule(config.warning.resetCron, async () => {
    console.log('[CRON] Haftalık ve günlük istatistikler sıfırlanıyor...');
    await istatistikSifirla(client);
  });

  // ── Her Gün Gece Yarısı Günlük Sefer Sıfırla (00:00 UTC+3 = 21:00 UTC) ──
  cron.schedule('0 21 * * *', async () => {
    console.log('[CRON] Günlük sefer sayıları sıfırlanıyor...');
    gunlukSifirla();
  });
};

// ── Günlük Uyarı Kontrolü ─────────────────────────────────────
async function gundlukUyariKontrol(client) {
  try {
    const db    = readDB();
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const uyariChannel = guild.channels.cache.get(config.channels.seferUyari);
    if (!uyariChannel) return;

    // Şoför rolüne sahip tüm üyeleri çek
    await guild.members.fetch();
    const soforler = guild.members.cache.filter(m =>
      m.roles.cache.has(config.roles.sofor) && !m.user.bot
    );

    const bugunUnvan = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });

    for (const [userId, member] of soforler) {
      const stats     = getUserStats(db, userId);
      const gunlukSay = stats.dailyTours || 0;

      // Günlük minimum tutmadıysa
      if (gunlukSay < config.warning.dailyMinTours) {
        // Kaç gün üst üste tutmadı?
        if (!db.weeklyWarningDays[userId]) {
          db.weeklyWarningDays[userId] = { consecutiveFail: 0 };
        }
        db.weeklyWarningDays[userId].consecutiveFail += 1;
        const failCount = db.weeklyWarningDays[userId].consecutiveFail;

        let embed;
        let content;

        if (failCount === 1) {
          // 1. gün: Sadece Şoför rolü etiketle
          embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('⚠️  GÜNLÜK SEFER UYARISI — 1. GÜN')
            .setDescription(
              `<@&${config.roles.sofor}>\n\n` +
              `<@${userId}> bugün (**${bugunUnvan}**) yeterli sefer yapmadı.\n\n` +
              `📊 Yapılan: **${gunlukSay}** | Gereken: **${config.warning.dailyMinTours}**\n\n` +
              `⚠️ Lütfen sefer sayınızı artırın!`
            )
            .setFooter({ text: 'GOYAN GROUP Otomatik Uyarı Sistemi' })
            .setTimestamp();
          content = `<@${userId}>`;

        } else if (failCount === 2) {
          // 2. gün: U1 rolü ver
          await member.roles.add(config.roles.u1).catch(() => {});
          embed = new EmbedBuilder()
            .setColor(0xFF8C00)
            .setTitle('🔶  GÜNLÜK SEFER UYARISI — 2. GÜN — U1 VERİLDİ')
            .setDescription(
              `<@${userId}> **2 gün üst üste** günlük minimum seferi tamamlayamadı.\n\n` +
              `📊 Bugün: **${gunlukSay}** sefer | Gereken: **${config.warning.dailyMinTours}**\n\n` +
              `🔶 <@&${config.roles.u1}> rolü verildi.`
            )
            .setFooter({ text: 'GOYAN GROUP Otomatik Uyarı Sistemi' })
            .setTimestamp();
          content = `<@${userId}> <@&${config.roles.u1}>`;

        } else if (failCount === 3) {
          // 3. gün: U2 rolü ver
          await member.roles.add(config.roles.u2).catch(() => {});
          embed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🔴  GÜNLÜK SEFER UYARISI — 3. GÜN — U2 VERİLDİ')
            .setDescription(
              `<@${userId}> **3 gün üst üste** günlük minimum seferi tamamlayamadı.\n\n` +
              `📊 Bugün: **${gunlukSay}** sefer | Gereken: **${config.warning.dailyMinTours}**\n\n` +
              `🔴 <@&${config.roles.u2}> rolü verildi.`
            )
            .setFooter({ text: 'GOYAN GROUP Otomatik Uyarı Sistemi' })
            .setTimestamp();
          content = `<@${userId}> <@&${config.roles.u2}>`;

        } else if (failCount >= 4) {
          // 4. gün: Yönetimi etiketle — kovulma uyarısı
          embed = new EmbedBuilder()
            .setColor(0x8B0000)
            .setTitle('🚨  KRİTİK UYARI — YÖNETİM MÜDAHALE GEREKTİRİYOR')
            .setDescription(
              `<@&${config.roles.yonetim}> <@&${config.roles.genelMudur}>\n\n` +
              `<@${userId}> **${failCount} gün üst üste** sefer yapmadı veya minimum seferi tamamlayamadı.\n\n` +
              `📊 Bugün: **${gunlukSay}** sefer | Gereken: **${config.warning.dailyMinTours}**\n\n` +
              `⛔ Bu kullanıcının **kovulması** değerlendirilmelidir.`
            )
            .setFooter({ text: 'GOYAN GROUP Otomatik Uyarı Sistemi' })
            .setTimestamp();
          content = `<@&${config.roles.yonetim}> <@&${config.roles.genelMudur}> <@${userId}>`;
        }

        if (embed) {
          await uyariChannel.send({ content, embeds: [embed] }).catch(console.error);
        }

      } else {
        // Yeterli sefer yaptı → sayacı sıfırla
        if (db.weeklyWarningDays[userId]) {
          db.weeklyWarningDays[userId].consecutiveFail = 0;
        }
        // U1/U2 rollerini kaldır
        await member.roles.remove(config.roles.u1).catch(() => {});
        await member.roles.remove(config.roles.u2).catch(() => {});
      }
    }

    writeDB(db);
    console.log('[CRON] Günlük uyarı kontrolü tamamlandı.');
  } catch (err) {
    console.error('[CRON HATA] Günlük uyarı:', err);
  }
}

// ── Haftalık Raporu DM Olarak Gönder ─────────────────────────
async function haftalikRaporGonder(client) {
  try {
    const db          = readDB();
    const reportUserId = config.reportUserId || process.env.REPORT_USER_ID;

    if (!reportUserId || reportUserId === 'YOUR_USER_ID_HERE') {
      console.warn('[RAPOR] REPORT_USER_ID ayarlanmamış.');
      return;
    }

    const user = await client.users.fetch(reportUserId).catch(() => null);
    if (!user) return;

    const embed = haftalikRaporEmbed(db.stats, db.completedTours);
    await user.send({ embeds: [embed] });
    console.log(`[RAPOR] Haftalık rapor ${user.username} kullanıcısına DM olarak gönderildi.`);
  } catch (err) {
    console.error('[RAPOR HATA]', err);
  }
}

// ── İstatistik Sıfırlama (Pazartesi) ─────────────────────────
async function istatistikSifirla(client) {
  try {
    const db = readDB();

    // Haftalık ve günlük sıfırla
    for (const userId in db.stats) {
      db.stats[userId].weeklyTours  = 0;
      db.stats[userId].dailyTours   = 0;
    }

    // Uyarı günlerini sıfırla
    db.weeklyWarningDays = {};

    // Aylık sıfırlama (her ayın 1'i ise)
    const now = new Date();
    if (now.getDate() === 1) {
      for (const userId in db.stats) {
        db.stats[userId].monthlyTours = 0;
      }
      console.log('[CRON] Aylık istatistikler de sıfırlandı.');
    }

    writeDB(db);
    console.log('[CRON] Haftalık istatistikler ve uyarı günleri sıfırlandı.');

    // Bilgi mesajı
    const guild = client.guilds.cache.first();
    const uyariChannel = guild?.channels.cache.get(config.channels.seferUyari);
    if (uyariChannel) {
      await uyariChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🔄  HAFTALIK SAYIM SIFIRLANDI')
            .setDescription('Yeni hafta başladı. Tüm günlük ve haftalık sefer sayıları sıfırlandı.\n\n💪 Yeni haftaya iyi başlangıçlar!')
            .setFooter({ text: 'GOYAN GROUP Sefer Sistemi' })
            .setTimestamp(),
        ],
      });
    }
  } catch (err) {
    console.error('[SIFIRLA HATA]', err);
  }
}

// ── Günlük Sefer Sayısını Sıfırla ────────────────────────────
function gunlukSifirla() {
  try {
    const db = readDB();
    for (const userId in db.stats) {
      db.stats[userId].dailyTours = 0;
    }
    writeDB(db);
    console.log('[CRON] Günlük sefer sayıları sıfırlandı.');
  } catch (err) {
    console.error('[GÜNLÜK SIFIRLA HATA]', err);
  }
}
