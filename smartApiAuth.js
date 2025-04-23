require("dotenv").config();
const { SmartAPI } = require("smartapi-javascript");
const { authenticator } = require("otplib");

const API_KEY = process.env.API_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const MPIN = process.env.MPIN;
const TOTP_SECRET = process.env.TOTP_SECRET;

// ✅ Generate TOTP OTP
const otp = authenticator.generate(TOTP_SECRET);
console.log("🔢 Generated OTP:", otp);

// ✅ Initialize SmartAPI
const smartApi = new SmartAPI({
    api_key: API_KEY,
});

async function login() {
    try {
        console.log("📡 Logging in...");

        // ✅ Login with MPIN & OTP
        const loginData = await smartApi.generateSession(CLIENT_ID, MPIN, otp);

        if (!loginData || !loginData.data || !loginData.data.jwtToken) {
            console.error("❌ Login Failed! Response:", loginData);
            return null;
        }

        // ✅ Extract Tokens
        const authToken = loginData.data.jwtToken;
        const refreshToken = loginData.data.refreshToken;
        const feedToken = loginData.data.feedToken; // Required for WebSockets

        console.log("✅ Login Successful!");
        console.log("🔑 JWT Token:", authToken);
        console.log("🔄 Refresh Token:", refreshToken);
        console.log("📡 Feed Token:", feedToken);

        // ✅ Return Tokens
        return { authToken, refreshToken, feedToken };
    } catch (error) {
        console.error("❌ Login Error:", error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = { login };
