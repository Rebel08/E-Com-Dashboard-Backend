const mongoose = require('mongoose');

const ShopifyCustomer = require('../models/Customer');

const ShopifyOrder = require('../models/Order');

const getCustomerLTVByCohorts = async (req, res) => {
    try {
        // Step 1: Aggregate first purchase dates for customers
        const firstPurchaseDates = await ShopifyOrder.aggregate([
            {
                $group: {
                    _id: "$customer.id", // Group by customer ID
                    firstPurchaseDate: { $min: "$created_at" }, // Get the earliest purchase date
                    totalSpent: { $sum: "$total_price" } // Calculate total spent
                }
            }
        ]);

        // Step 2: Process the results to group by month
        const cohorts = {};
        firstPurchaseDates.forEach(customer => {
            const date = new Date(customer.firstPurchaseDate);
            const cohortKey = `${date.getFullYear()}-${date.getMonth() + 1}`; // Format: YYYY-MM

            if (!cohorts[cohortKey]) {
                cohorts[cohortKey] = {
                    totalLTV: 0,
                    customerCount: 0,
                    averageLTV: 0 // Initialize average LTV
                };
            }

            cohorts[cohortKey].totalLTV += parseFloat(customer.totalSpent); // Add to total LTV for the cohort
            cohorts[cohortKey].customerCount += 1; // Increment customer count
        });

        // Step 3: Calculate average LTV for each cohort
        for (const cohort in cohorts) {
            cohorts[cohort].averageLTV = cohorts[cohort].totalLTV / cohorts[cohort].customerCount; // Calculate average LTV
        }

        // Convert cohorts object to an array for easier visualization
        const cohortsArray = Object.keys(cohorts).map(cohort => ({
            cohort: cohort,
            totalLTV: cohorts[cohort].totalLTV,
            averageLTV: cohorts[cohort].averageLTV,
            customerCount: cohorts[cohort].customerCount
        }));

        // Step 4: Send the results back to the client
        return res.status(200).json({
            success: true,
            message: 'Cohorts LTV calculated successfully',
            data: cohortsArray
        });
    } catch (error) {
        console.error("Error calculating LTV by cohorts:", error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while calculating LTV',
            error: error.message
        });
    }
};

module.exports = {
    getCustomerLTVByCohorts
};