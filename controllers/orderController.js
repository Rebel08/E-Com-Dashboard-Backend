const Order = require('../models/Order');



// Get Total Sales Over Time
exports.getTotalSalesOverTime = async (req, res) => {
  try {
    const timeFrame = req.params.timeFrame; // daily, monthly, quarterly, yearly

    // Determine the grouping format based on the time frame
    let groupByFormat;
    switch (timeFrame) {
      case 'daily':
        groupByFormat = "%Y-%m-%d";
        break;
      case 'monthly':
        groupByFormat = "%Y-%m";
        break;
      case 'quarterly':
        groupByFormat = "%Y-Q%q"; // For quarterly aggregation
        break;
      case 'yearly':
        groupByFormat = "%Y";
        break;
      default:
        return res.status(400).send('Invalid time frame');
    }

    const aggregatePipeline = [
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
          totalSales: { $sum: { $toDouble: "$total_price" } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const result = await Order.aggregate(aggregatePipeline);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


exports.getSalesGrowthRateOverTime = async (req, res) => {
  try {
    const timeFrame = req.params.timeFrame; // daily, monthly, quarterly, yearly

    // Determine the grouping format based on the time frame
    let groupByFormat;
    switch (timeFrame) {
      case 'daily':
        groupByFormat = "%Y-%m-%d";
        break;
      case 'monthly':
        groupByFormat = "%Y-%m";
        break;
      case 'quarterly':
        groupByFormat = "%Y-Q"; // For quarterly aggregation
        break;
      case 'yearly':
        groupByFormat = "%Y";
        break;
      default:
        return res.status(400).send('Invalid time frame');
    }

    const aggregatePipeline = [
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
          totalSales: { $sum: { $toDouble: "$total_price" } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    let result = await Order.aggregate(aggregatePipeline);

    // Calculate the sales growth rate manually in JavaScript
    result = result.map((current, index, array) => {
      if (index === 0) {
        current.salesGrowthRate = 0; // No previous period to compare to
      } else {
        const previous = array[index - 1];
        const growthRate = ((current.totalSales - previous.totalSales) / previous.totalSales) * 100;
        current.salesGrowthRate = growthRate;
      }
      return current;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};











// Helper function to get start date of the specified period
const getStartOfPeriod = (date, period) => {
    const startDate = new Date(date);
    if (period === 'daily') {
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'quarterly') {
        const quarter = Math.floor((startDate.getMonth() + 3) / 3);
        startDate.setMonth((quarter - 1) * 3);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'yearly') {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
    }
    return startDate;
};

// Controller to identify repeat customers
exports.getRepeatCustomers = async (req, res) => {
    try {
        const { period } = req.params; // daily, monthly, quarterly, or yearly

        if (!['daily', 'monthly', 'quarterly', 'yearly'].includes(period)) {
            return res.status(400).json({ message: "Invalid period specified" });
        }

        const repeatCustomers = await Order.aggregate([
            // Project the required fields
            {
                $project: {
                    customerId: "$customer.id",
                    orderDate: "$created_at",
                }
            },
            // Add a field for the start of the specified period
            {
                $addFields: {
                    periodStartDate: {
                        $dateFromString: {
                            dateString: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: "$created_at"
                                }
                            },
                            onError: null,
                            onNull: null
                        }
                    }
                }
            },
            // Group by customerId and periodStartDate
            {
                $group: {
                    _id: {
                        customerId: "$customerId",
                        periodStartDate: getStartOfPeriod("$created_at", period)
                    },
                    orderCount: { $sum: 1 }
                }
            },
            // Filter customers with more than one order in the same period
            {
                $match: {
                    orderCount: { $gt: 1 }
                }
            },
            // Group by customerId to get unique repeat customers
            {
                $group: {
                    _id: "$_id.customerId",
                    repeatOrders: { $push: "$orderCount" }
                }
            },
            // Lookup customer details
            {
                $lookup: {
                    from: 'shopifyCustomers', // Assuming your customer collection is named 'shopifyCustomers'
                    localField: '_id',
                    foreignField: 'id',
                    as: 'customerDetails'
                }
            },
            // Unwind the customer details
            {
                $unwind: "$customerDetails"
            },
            // Project the final fields
            {
                $project: {
                    _id: 0,
                    customerId: "$_id",
                    repeatOrders: 1,
                    customerDetails: {
                        firstName: "$customerDetails.first_name",
                        lastName: "$customerDetails.last_name",
                        email: "$customerDetails.email",
                        city: "$customerDetails.default_address.city",
                        country: "$customerDetails.default_address.country_name"
                    }
                }
            }
        ]);

        res.status(200).json(repeatCustomers);
    } catch (error) {
        console.error("Error fetching repeat customers", error);
        res.status(500).json({ message: "Server error" });
    }
};
