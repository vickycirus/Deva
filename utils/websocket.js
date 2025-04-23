// index.js
require('dotenv').config();
const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');   // official SDK :contentReference[oaicite:3]{index=3}
const { authenticator } = require('otplib');
const { login } = require('../smartApiAuth');          // your working auth helper
async function start() {
    const otp = authenticator.generate(process.env.TOTP_SECRET);      // TOTP for 2FA :contentReference[oaicite:4]{index=4}
    const { authToken, feedToken } = await login();                  // returns JWT & feed token 
    if (!authToken || !feedToken) throw new Error('Login failed');
    console.log('✅ authToken & feedToken', { authToken: '***', feedToken: '***' });
    const ws = new WebSocketV2({
        clientcode: process.env.CLIENT_ID,   // Angel One client code :contentReference[oaicite:5]{index=5}
        jwttoken: authToken,               // Must be your JWT :contentReference[oaicite:6]{index=6}
        apikey: process.env.API_KEY,     // SmartAPI key :contentReference[oaicite:7]{index=7}
        feedtype: feedToken,               // **Your feed token**, not 'ltp' :contentReference[oaicite:8]{index=8}
    });

    await ws.connect();                   // performs handshake + heartbeat :contentReference[oaicite:9]{index=9}
    console.log('🔌 WebSocketV2 connected');
    ws.fetchData({
        correlationID: 'corr1',              // any unique string :contentReference[oaicite:10]{index=10}
        action: 1,                    // 1 = SUBSCRIBE (ACTION.Subscribe) :contentReference[oaicite:11]{index=11}
        mode: 1,                    // 1 = LTP mode (MODE.LTP) :contentReference[oaicite:12]{index=12}
        exchangeType: 1,                    // 1 = NSE_CM (EXCHANGES.nse_cm) :contentReference[oaicite:13]{index=13}
        tokens: [
            'nse_cm|1333',                     // RELIANCE token :contentReference[oaicite:14]{index=14}
            'nse_cm|26009',                    // NIFTY 50 token :contentReference[oaicite:15]{index=15}
            // …add all 272 F&O tokens here
        ],
    });
    console.log('📡 Subscribed to tokens');
    ws.on('tick', (tick) => {
        console.log(`💹 ${tick.token} → ₹${tick.ltp}`);  // tick = { token, ltp, ... } :contentReference[oaicite:16]{index=16}
        // → Pass to your 1‑min candle builder
    });

    ws.on('error', (e) => console.error('🛑 Error', e));
    ws.on('close', () => console.log('❌ Closed'));
}

start().catch(console.error);
