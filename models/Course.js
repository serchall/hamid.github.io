const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: String,
  desc: String,
  image: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Course', courseSchema); 