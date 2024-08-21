const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  total_price_set: {
    type: Number,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('Order', OrderSchema, 'shopifyOrders');
