const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number }],
  totalAmount: Number,
  orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema); 