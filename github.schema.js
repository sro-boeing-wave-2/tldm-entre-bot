const mongoose = require('mongoose');
const { Schema } = mongoose;

const EntreBotSchema = new Schema({
    channelId1: String,
    channelId2: String
});

module.exports = mongoose.model('EntreBot', EntreBotSchema, 'EntreBot');