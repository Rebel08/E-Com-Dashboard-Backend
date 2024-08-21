const Customer = require('../models/Customer');

//  New Customers Added Over Time
exports.getNewCustomersOverTime = async (req, res) => {
    try {
        const timeFrame = req.params.timeFrame; // daily, monthly, quarterly, yearly

        let groupByFormat;
        switch (timeFrame) {
            case 'daily':
                groupByFormat = "%Y-%m-%d";
                break;
            case 'monthly':
                groupByFormat = "%Y-%m";
                break;
            case 'quarterly':
                groupByFormat = "%Y-Q"; // Quarterly needs some special handling
                break;
            case 'yearly':
                groupByFormat = "%Y";
                break;
            default:
                return res.status(400).send('Invalid time frame');
        }

        const newCustomers = await Customer.aggregate([
            {
                $addFields: {
                    createdAtDate: {
                        $dateFromString: {
                            dateString: "$created_at"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: "$createdAtDate" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(newCustomers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};





// Geographical Distribution of Customers
exports.getGeographicalDistribution = async (req, res) => {
    try {
        const geoDistribution = await Customer.aggregate([
            {
                $group: {
                    _id: "$default_address.city",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json(geoDistribution);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

//  Customer Lifetime Value by Cohorts
exports.getCustomerLifetimeValueByCohorts = async (req, res) => {
    try {
        const cohortAnalysis = await Customer.aggregate([
            {
                $addFields: {
                    firstPurchaseMonth: {
                        $dateToString: { format: "%Y-%m", date: { $dateFromString: { dateString: "$created_at" } } }
                    }
                }
            },
            {
                $group: {
                    _id: "$firstPurchaseMonth",
                    totalSpent: { $sum: { $toDouble: "$total_spent" } },
                    customerCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 1,
                    avgLifetimeValue: { $divide: ["$totalSpent", "$customerCount"] }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(cohortAnalysis);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};
