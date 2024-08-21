const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  created_at: {
    type: Date,
    required: true,
  },
  default_address: {
    city: {
      type: String,
      required: true,
    },
    // Add other address fields as needed
  },
  // Add other fields from shopifyCustomers collection as needed
});

module.exports = mongoose.model('Customer', CustomerSchema, 'shopifyCustomers');