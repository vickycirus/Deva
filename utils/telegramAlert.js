// utils/telegramAlert.js

const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramAlert(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('❗ Telegram Bot Token or Chat ID missing');
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',  // Better formatting
        });
        console.log('📨 Telegram alert sent!');
    } catch (err) {
        console.error('🛑 Telegram alert error:', err.message);
    }
}

module.exports = { sendTelegramAlert };
