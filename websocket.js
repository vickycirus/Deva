const WebSocket = require('ws');
const { login } = require('./smartApiAuth');

async function startWebSocket(tokens) {
    const session = await login();
    const feedToken = session.feedToken;
    const clientId = process.env.CLIENT_ID;

    const ws = new WebSocket('wss://smartapisocket.angelbroking.com/smart-stream', {
        headers: {
            'Authorization': feedToken,
        }
    });

    ws.on('open', () => {
        console.log('🔌 WebSocket Connected');

        // Manually send authentication payload
        const authPayload = {
            action: "authenticate",
            params: {
                client_code: clientId,
                feed_token: feedToken
            }
        };
        ws.send(JSON.stringify(authPayload));
        console.log('🔑 Sent authentication...');
    });

    ws.on('message', (data) => {
        const message = JSON.parse(data);

        if (message?.action === "authenticate" && message?.status === true) {
            console.log('✅ Authentication successful! Subscribing...');

            const subPayload = {
                action: "subscribe",
                params: {
                    mode: "LTP",
                    tokens: tokens.map(token => `nse_cm|${token}`)
                }
            };
            ws.send(JSON.stringify(subPayload));
            console.log('📡 Subscribed to tokens.');
        }

        if (message?.action === "feed") {
            const feedData = message.data;
            console.log(`💹 ${feedData.token}: ₹${feedData.ltp}`);
            // Save these for candle making next
        }
    });

    ws.on('error', (error) => {
        console.error('🛑 WebSocket Error:', error.message);
    });

    ws.on('close', () => {
        console.log('❌ WebSocket Closed');
    });
}

module.exports = { startWebSocket };
