import Order from "../models/order.js";
import User from "../models/user.js";
import Product from "../models/product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class AnalyticsController {
    // Thống kê tổng quan
    getGeneralStats = asyncHandler(async (req, res) => {
        const { year = new Date().getFullYear() } = req.query;

        // Tổng doanh thu từ đơn hàng đã giao thành công theo năm
        const revenueResult = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // Tổng số đơn hàng đã giao theo năm
        const totalOrders = await Order.countDocuments({
            status: "delivered",
            createdAt: {
                $gte: new Date(`${year}-01-01`),
                $lt: new Date(`${parseInt(year) + 1}-01-01`)
            }
        });

        // Tổng số khách hàng theo năm
        const totalCustomers = await User.countDocuments({
            role: "customer",
            createdAt: {
                $gte: new Date(`${year}-01-01`),
                $lt: new Date(`${parseInt(year) + 1}-01-01`)
            }
        });

        // Tổng số sản phẩm (không thay đổi theo năm)
        const totalProducts = await Product.countDocuments();

        // Tính toán growth rate so với năm trước
        const lastYear = parseInt(year) - 1;

        // Doanh thu năm trước
        const revenueLastYearResult = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                    createdAt: {
                        $gte: new Date(`${lastYear}-01-01`),
                        $lt: new Date(`${year}-01-01`)
                    }
                }
            },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const revenueLastYear = revenueLastYearResult[0]?.totalRevenue || 0;

        // Đơn hàng năm trước
        const ordersLastYear = await Order.countDocuments({
            status: "delivered",
            createdAt: {
                $gte: new Date(`${lastYear}-01-01`),
                $lt: new Date(`${year}-01-01`)
            }
        });

        // Khách hàng năm trước
        const customersLastYear = await User.countDocuments({
            role: "customer",
            createdAt: {
                $gte: new Date(`${lastYear}-01-01`),
                $lt: new Date(`${year}-01-01`)
            }
        });

        // Tính phần trăm tăng trưởng so với năm trước
        const revenueGrowth = revenueLastYear > 0
            ? ((totalRevenue - revenueLastYear) / revenueLastYear * 100).toFixed(1)
            : (totalRevenue > 0 ? "+100" : "0");

        const ordersThisYear = await Order.countDocuments({
            status: "delivered",
            createdAt: {
                $gte: new Date(`${year}-01-01`),
                $lt: new Date(`${parseInt(year) + 1}-01-01`)
            }
        });

        const orderGrowth = ordersLastYear > 0
            ? ((ordersThisYear - ordersLastYear) / ordersLastYear * 100).toFixed(1)
            : (ordersThisYear > 0 ? "+100" : "0");

        const customerGrowth = customersLastYear > 0
            ? ((totalCustomers - customersLastYear) / customersLastYear * 100).toFixed(1)
            : (totalCustomers > 0 ? "+100" : "0");

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalProducts,
                growth: {
                    revenue: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`,
                    orders: `${orderGrowth >= 0 ? '+' : ''}${orderGrowth}%`,
                    customers: `${customerGrowth >= 0 ? '+' : ''}${customerGrowth}%`,
                    products: "+5.7%" // Static for now
                }
            }
        });
    });

    // Thống kê doanh thu theo tháng
    getRevenue = asyncHandler(async (req, res) => {
        const { year = new Date().getFullYear(), type = 'monthly' } = req.query;

        let groupBy, dateFormat;

        if (type === 'monthly') {
            groupBy = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
            };
            dateFormat = 'month';
        } else if (type === 'yearly') {
            groupBy = {
                year: { $year: "$createdAt" }
            };
            dateFormat = 'year';
        }

        const pipeline = [
            {
                $match: {
                    status: "delivered",
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: "$totalPrice" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ];

        const results = await Order.aggregate(pipeline);

        // Format dữ liệu theo tháng
        const monthlyData = [];
        if (type === 'monthly') {
            for (let month = 1; month <= 12; month++) {
                const found = results.find(r => r._id.month === month);
                monthlyData.push({
                    month: `T${month}`,
                    value: found ? Math.round(found.revenue / 1000000) : 0, // Convert to millions
                    revenue: found ? found.revenue : 0,
                    orderCount: found ? found.orderCount : 0
                });
            }
        } else {
            results.forEach(r => {
                monthlyData.push({
                    year: r._id.year,
                    revenue: r.revenue,
                    orderCount: r.orderCount
                });
            });
        }

        res.status(200).json({
            success: true,
            data: monthlyData,
            year: parseInt(year),
            type
        });
    });

    // Danh sách đơn hàng đã giao thành công
    getCompletedOrders = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;

        const orders = await Order.find({ status: "delivered" })
            .populate("user", "name email")
            .populate("items.product", "name price images")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Order.countDocuments({ status: "delivered" });

        // Format dữ liệu
        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderCode: `#ORD${order._id.toString().slice(-6).toUpperCase()}`,
            customer: order.user.name,
            customerEmail: order.user.email,
            products: order.items.map(item => `${item.product.name} x${item.quantity}`).join(', '),
            totalProducts: order.items.reduce((sum, item) => sum + item.quantity, 0),
            total: order.totalPrice,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            date: order.createdAt,
            shippingAddress: order.shippingAddress
        }));

        res.status(200).json({
            success: true,
            data: formattedOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    });

    // Thống kê khách hàng mới
    getNewCustomers = asyncHandler(async (req, res) => {
        const { year = new Date().getFullYear(), type = 'monthly' } = req.query;

        let groupBy;

        if (type === 'monthly') {
            groupBy = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
            };
        } else if (type === 'yearly') {
            groupBy = {
                year: { $year: "$createdAt" }
            };
        }

        const pipeline = [
            {
                $match: {
                    role: "customer",
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ];

        const results = await User.aggregate(pipeline);

        // Format dữ liệu theo tháng
        const monthlyData = [];
        if (type === 'monthly') {
            for (let month = 1; month <= 12; month++) {
                const found = results.find(r => r._id.month === month);
                monthlyData.push({
                    month: `T${month}`,
                    count: found ? found.count : 0
                });
            }
        } else {
            results.forEach(r => {
                monthlyData.push({
                    year: r._id.year,
                    count: r.count
                });
            });
        }

        res.status(200).json({
            success: true,
            data: monthlyData,
            year: parseInt(year),
            type
        });
    });

    // Top 10 sản phẩm bán chạy nhất
    getTopProducts = asyncHandler(async (req, res) => {
        const { limit = 10 } = req.query;

        const topProducts = await Product.find()
            .populate("category", "name")
            .populate("brand", "name")
            .sort({ soldCount: -1 })
            .limit(parseInt(limit));

        // Tính tổng doanh thu cho mỗi sản phẩm từ các đơn hàng đã giao
        const productsWithRevenue = await Promise.all(
            topProducts.map(async (product) => {
                const revenueResult = await Order.aggregate([
                    { $match: { status: "delivered" } },
                    { $unwind: "$items" },
                    { $match: { "items.product": product._id } },
                    {
                        $group: {
                            _id: "$items.product",
                            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                            totalSold: { $sum: "$items.quantity" }
                        }
                    }
                ]);

                const revenue = revenueResult[0]?.totalRevenue || 0;
                const soldFromOrders = revenueResult[0]?.totalSold || 0;

                // Calculate discounted price
                const discountedPrice = product.price - (product.price * product.discountPercentage / 100);

                return {
                    _id: product._id,
                    name: product.name,
                    originalPrice: product.price,
                    discountedPrice: discountedPrice,
                    price: discountedPrice, // For backward compatibility
                    soldCount: product.soldCount,
                    soldFromOrders, // Số lượng bán từ đơn đã giao
                    revenue,
                    category: product.category.name,
                    brand: product.brand.name,
                    images: product.images,
                    discountPercentage: product.discountPercentage,
                    stock: product.stock
                };
            })
        );

        // Sắp xếp lại theo doanh thu
        productsWithRevenue.sort((a, b) => b.revenue - a.revenue);

        res.status(200).json({
            success: true,
            data: productsWithRevenue,
            limit: parseInt(limit)
        });
    });

    // Thống kê tổng hợp dashboard
    getDashboardStats = asyncHandler(async (req, res) => {
        const currentMonth = new Date();
        currentMonth.setDate(1);

        // Tất cả thống kê song song
        const [
            generalStats,
            revenueData,
            topProducts,
            recentOrders,
            customerStats
        ] = await Promise.all([
            // General stats
            this.getGeneralStatsData(),

            // Revenue data for current year
            this.getRevenueData(new Date().getFullYear()),

            // Top 10 products
            this.getTopProductsData(10),

            // Recent completed orders
            this.getRecentOrdersData(5),

            // Customer growth this month
            this.getNewCustomersData(new Date().getFullYear())
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: generalStats,
                revenueChart: revenueData,
                topProducts: topProducts.slice(0, 10),
                recentOrders,
                customerGrowth: customerStats
            }
        });
    });

    // Helper methods for getDashboardStats
    getGeneralStatsData = async () => {
        const [revenueResult, totalOrders, totalCustomers, totalProducts] = await Promise.all([
            Order.aggregate([
                { $match: { status: "delivered" } },
                { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
            ]),
            Order.countDocuments(),
            User.countDocuments({ role: "customer" }),
            Product.countDocuments()
        ]);

        return {
            totalRevenue: revenueResult[0]?.totalRevenue || 0,
            totalOrders,
            totalCustomers,
            totalProducts
        };
    };

    getRevenueData = async (year) => {
        const results = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    revenue: { $sum: "$totalPrice" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthlyData = [];
        for (let month = 1; month <= 12; month++) {
            const found = results.find(r => r._id.month === month);
            monthlyData.push({
                month: `T${month}`,
                value: found ? Math.round(found.revenue / 1000000) : 0
            });
        }

        return monthlyData;
    };

    getTopProductsData = async (limit) => {
        const topProducts = await Product.find()
            .populate("category", "name")
            .populate("brand", "name")
            .sort({ soldCount: -1 })
            .limit(limit);

        return Promise.all(
            topProducts.map(async (product) => {
                const revenueResult = await Order.aggregate([
                    { $match: { status: "delivered" } },
                    { $unwind: "$items" },
                    { $match: { "items.product": product._id } },
                    {
                        $group: {
                            _id: "$items.product",
                            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                        }
                    }
                ]);

                // Calculate discounted price
                const discountedPrice = product.price - (product.price * product.discountPercentage / 100);

                return {
                    name: product.name,
                    sold: product.soldCount,
                    originalPrice: product.price,
                    discountedPrice: discountedPrice,
                    price: discountedPrice, // For display
                    revenue: revenueResult[0]?.totalRevenue || 0,
                    discountPercentage: product.discountPercentage,
                    color: this.getRandomColor()
                };
            })
        );
    };

    getRecentOrdersData = async (limit) => {
        const orders = await Order.find({ status: "delivered" })
            .populate("user", "name")
            .populate("items.product", "name")
            .sort({ createdAt: -1 })
            .limit(limit);

        return orders.map(order => ({
            id: `#ORD${order._id.toString().slice(-3).toUpperCase()}`,
            customer: order.user.name,
            products: order.items.map(item => `${item.product.name} x${item.quantity}`).join(', '),
            total: order.totalPrice,
            status: 'completed',
            date: order.createdAt.toLocaleDateString('vi-VN')
        }));
    };

    getNewCustomersData = async (year) => {
        const results = await User.aggregate([
            {
                $match: {
                    role: "customer",
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const monthlyData = [];
        for (let month = 1; month <= 12; month++) {
            const found = results.find(r => r._id.month === month);
            monthlyData.push({
                month: `T${month}`,
                count: found ? found.count : 0
            });
        }

        return monthlyData;
    };

    getRandomColor = () => {
        const colors = [
            'from-pink-400 to-purple-500',
            'from-blue-400 to-indigo-500',
            'from-green-400 to-teal-500',
            'from-yellow-400 to-orange-500',
            'from-red-400 to-pink-500'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };
}

export default new AnalyticsController();
