// models/PatternModel.js

const mongoose = require('mongoose');

const patternSchema = new mongoose.Schema({
    stockName: String,
    patternName: String,
    action: String,         // Always "BUY" in our case
    stopLoss: Number,
    price: Number,
    target: Number,         // (optional) or you can calculate based on profit%
    optionType: String,     // "CALL"
    timestamp: { type: Date, default: Date.now },
});

const PatternModel = mongoose.model('Pattern', patternSchema);

module.exports = PatternModel;
