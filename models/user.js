  
const mongoose = require('mongoose');

module.exports = mongoose.model('user',new mongoose.Schema({
    email: String,
    password: String
}));