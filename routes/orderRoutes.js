const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Route to get Total Sales Over Time
router.get('/total-sales/:timeFrame', orderController.getTotalSalesOverTime);

// Route for repeat customers
router.get('/repeat-customers/:period', orderController.getRepeatCustomers);

// Route to get Sales Growth Rate Over Time
router.get('/sales-growth/:timeFrame', orderController.getSalesGrowthRateOverTime);

module.exports = router;

