const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    sno: {
      type: Number,
      required: true,
      unique:true
    },

    customerName: {
      type: String
    },

     products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        barcode:Number,
        price: Number,
        quantity: Number,
        total: Number,
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        categoryDetails: {
          name: String,
          description: String,
        },
      },
    ],

    overallTotal: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
