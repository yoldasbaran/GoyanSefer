// ============================================================
// index.js — GOYAN GROUP Sefer Yönetim Botu — Ana Giriş
// ============================================================

require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');

// ── Discord Client ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ── Event Yükleyiciler ────────────────────────────────────────
const onReady          = require('./events/ready');
const onMessageCreate  = require('./events/messageCreate');
const onInteraction    = require('./events/interactionCreate');

// ── Event Dinleyiciler ────────────────────────────────────────
client.once('ready', () => onReady(client));

client.on('messageCreate', (message) => onMessageCreate(message));

client.on('interactionCreate', (interaction) => onInteraction(interaction));

// ── Yakalanmamış Hatalar ─────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

// ── Bota Giriş Yap ───────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('❌ DISCORD_TOKEN bulunamadı! .env dosyasını kontrol edin.');
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error('❌ Bot giriş yapamadı:', err.message);
  process.exit(1);
});
