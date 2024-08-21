const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');



const { getCustomerLTVByCohorts } = require('../controllers/cohrtController');
router.get('/ltv/cohorts', getCustomerLTVByCohorts);



// 1. New Customers Added Over Time
router.get('/new-customers/:timeFrame', customerController.getNewCustomersOverTime);


// 2. Geographical Distribution of Customers
router.get('/geographical-distribution', customerController.getGeographicalDistribution);

// 3. Customer Lifetime Value by Cohorts
router.get('/lifetime-value-by-cohorts', customerController.getCustomerLifetimeValueByCohorts);

module.exports = router;

