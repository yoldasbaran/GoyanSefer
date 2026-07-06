// ============================================================
// config.js — GOYAN GROUP Sefer Botu Merkezi Konfigürasyon
// ============================================================

module.exports = {
  // ── Şirket Adı ────────────────────────────────────────────
  botName: 'GOYAN GROUP',

  // ── Prefix ────────────────────────────────────────────────
  prefix: '!',

  // ── Kanal ID'leri ─────────────────────────────────────────
  channels: {
    seferIzin:  '1519073246081716235',
    seferOnay:  '1519082136379068649',
    seferBitis: '1519073551032909884',
    seferLog:   '1520197397039288521',
    seferUyari: '1520185831065911446',
  },

  // ── Rol ID'leri ───────────────────────────────────────────
  roles: {
    sofor:      '1492965426248941618',
    yonetim:    '1438670478964166666',
    genelMudur: '1502300256065294427',
    u1:         '1503758361857102005',
    u2:         '1520188150616555550',
  },

  // ── Haftalık DM Rapor Alacak Kullanıcı ID'si ─────────────
  // .env üzerinden de okunabilir; burası fallback
  reportUserId: process.env.REPORT_USER_ID || 'YOUR_USER_ID_HERE',

  // ── Şehirler ──────────────────────────────────────────────
  cities: [
    'Niğde',
    'Adana',
    'Ceyhan',
    'Osmaniye',
    'Yarbaş',
    'Kahramanmaraş',
    'Göksun',
    'Elbistan',
  ],

  // ── Saatlik Sefer Limiti ──────────────────────────────────
  hourlyTourLimitMs: 60 * 60 * 1000, // 1 saat

  // ── Araçlar (Plakalar) ────────────────────────────────────
  vehicles: [
    '33 CFU 18',
    '33 CFU 99',
    '42 RD 696',
    '33 HS 211',
    '34 KKG 879',
    '43 KG 955',
    '33 AEA 89',
  ],

  // ── Uyarı Sistemi ─────────────────────────────────────────
  warning: {
    // Günlük minimum sefer sayısı (sabit)
    dailyMinTours: 2,

    // Cron: Her gün 22:00 (Türkiye = UTC+3 → 19:00 UTC)
    cronSchedule: '0 19 * * *',

    // Pazar 23:00 TR saati = 20:00 UTC
    weeklyCron: '0 20 * * 0',

    // Pazartesi 00:00 TR saati = 21:00 UTC Pazar gecesi
    resetCron: '0 21 * * 0',
  },

  // ── Embed Renkleri ────────────────────────────────────────
  colors: {
    primary: 0x2B2D31,
    success: 0x57F287,
    danger:  0xED4245,
    warning: 0xFEE75C,
    info:    0x5865F2,
    gold:    0xF1C40F,
    purple:  0x9B59B6,
  },

  // ── Veritabanı Yolu ───────────────────────────────────────
  dbPath: './database.json',
};
