const express = require("express");
const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const { auth, allowRoles } = require("../middleware/authMiddleware");

const Router = express.Router();

// GET /api/dashboard
Router.get("/dashboard", auth, allowRoles("admin"), async (req, res) => {
  try {
    const now = new Date();

    // ---------- TODAY RANGE ----------
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // YEAR RANGE (for monthly)
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const startOfNextYear = new Date(year + 1, 0, 1);

    // ---------- PARALLEL QUERIES ----------
    const [
      todayOrders,      // today orders with full details
      totalOrders,      // overall order count
      totalRevenueAgg,  // overall revenue
      topProductsRaw,   // best selling products
      monthlyAgg,       // monthly sales for selected year
      yearlyAgg,        // year-wise sales
      categoryAgg       // category-wise sales
    ] = await Promise.all([
      // 1) Today orders (details)
      orderModel.find({
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }).sort({ createdAt: -1 }),

      // 2) Overall total orders count
      orderModel.countDocuments(),

      // 3) Overall total revenue
      orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$overallTotal" },
          },
        },
      ]),

      // 4) Top products by sales
      productModel
        .find({})
        .sort({ sales: -1 })
        .limit(5)
        .select("name sales stock price"),

      // 5) Monthly sales for selected year
      orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear, $lt: startOfNextYear },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            monthlyRevenue: { $sum: "$overallTotal" },
            monthlyOrders: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]),

      // 6) Year-wise sales (all years)
      orderModel.aggregate([
        {
          $group: {
            _id: { year: { $year: "$createdAt" } },
            yearlyRevenue: { $sum: "$overallTotal" },
            yearlyOrders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1 } },
      ]),

      // 7) Category-wise sales (based on order products)
      orderModel.aggregate([
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.categoryDetails.name",
            categoryRevenue: { $sum: "$products.total" },
            itemsSold: { $sum: "$products.quantity" },
          },
        },
        { $sort: { categoryRevenue: -1 } },
      ]),
    ]);

    // ---------- TODAY REVENUE ----------
    const todayRevenue = todayOrders.reduce(
      (sum, o) => sum + (o.overallTotal || 0),
      0
    );

    // ---------- OVERALL REVENUE ----------
    const overallRevenue =
      (totalRevenueAgg[0] && totalRevenueAgg[0].totalRevenue) || 0;

    // ---------- TOP PRODUCTS ----------
    const topProducts = topProductsRaw.map((p) => ({
      name: p.name,
      price: p.price,
      sales: p.sales || 0,
      stock: p.stock || 0,
    }));

    // ---------- MONTHLY SALES ----------
    const monthlySales = monthlyAgg.map((m) => ({
      month: m._id.month,             // 1–12
      orders: m.monthlyOrders,        // monthly order count
      revenue: m.monthlyRevenue,      // monthly revenue
    }));

    // ---------- YEARLY SALES ----------
    const yearlySales = yearlyAgg.map((y) => ({
      year: y._id.year,
      orders: y.yearlyOrders,
      revenue: y.yearlyRevenue,
    }));

    // ---------- CATEGORY-WISE SALES ----------
    const categorySales = categoryAgg.map((c) => ({
      category: c._id || "Unknown",
      itemsSold: c.itemsSold,
      revenue: c.categoryRevenue,
    }));

    // ---------- FORMAT TODAY ORDER DETAILS (FIXED) ----------
    const todayOrderDetails = todayOrders.map((o) => ({
      _id: o._id,               // KEEP _id
      sno: o.sno,
      customerName: o.customerName,
      
      // FIX: Include overallTotal specifically for the Bill Component
      overallTotal: o.overallTotal, 
      totalAmount: o.overallTotal, // Keep this alias if needed
      
      // FIX: Include createdAt specifically for Date formatting
      createdAt: o.createdAt,
      date: o.createdAt,
      
      products: o.products.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,       // FIX: Added price so it shows in Bill
        total: p.total,
      })),
    }));

    // ---------- FINAL RESPONSE ----------
    return res.status(200).json({
      success: true,

      // 🔹 TODAY
      today: {
        date: startOfToday.toISOString().split("T")[0],
        ordersCount: todayOrders.length,
        revenue: todayRevenue,
        orders: todayOrderDetails,   // "today sale-order details"
      },

      // 🔹 MONTHLY (selected year)
      monthly: {
        year,
        data: monthlySales,          // monthly wise: orders + revenue
      },

      // 🔹 YEARLY (all years)
      yearly: {
        data: yearlySales,           // year wise: orders + revenue
      },

      // 🔹 OVERALL
      overall: {
        totalOrders,
        totalRevenue: overallRevenue,
      },

      // 🔹 TOP PRODUCTS
      topProducts,

      // 🔹 CATEGORY WISE SALES
      categorySales,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = Router;