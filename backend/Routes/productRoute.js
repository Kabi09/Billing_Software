const express = require("express");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const { auth, allowRoles } = require("../middleware/authMiddleware");

const Router = express.Router();

// ---------------------------
// ADD PRODUCT (POST)
// ---------------------------
Router.post("/product", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { name, barcode, category, price, stock } = req.body;

    // 1. Basic Validation
    if (!name.trim() || !barcode.trim() || price == null) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price Value Incorrect",
      });
    }

    // 2. UNIQUE CHECK: Verify if barcode already exists
    const existingProduct = await productModel.findOne({ barcode });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Barcode already exists! Use a different one.",
      });
    }

    // 3. Category Logic
    let categoryData = null;
    if (category && category.trim() !== "") {
      // Case A: User provided a Category ID
      categoryData = await categoryModel.findById(category);
      if (!categoryData) {
        return res.status(404).json({
          success: false,
          message: "The provided Category ID does not exist",
        });
      }
    } else {
      // Case B: No Category provided, use Default "None"
      categoryData = await categoryModel.findOne({ name: "None" });
      if (!categoryData) {
        categoryData = new categoryModel({
          name: "None",
          description: "Default category for uncategorized items",
        });
        await categoryData.save();
      }
    }

    // 4. Save Product
    const product = productModel({
      name,
      barcode,
      category: categoryData._id,
      categoryDetails: {
        name: categoryData.name,
        description: categoryData.description,
      },
      price,
      stock,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added Successfully",
      product,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
});

// ---------------------------
// GET ALL PRODUCTS
// ---------------------------
Router.get("/product", auth, allowRoles("admin", "employee"), async (req, res) => {
  try {
    const products = await productModel.find().populate("category");

    if (!products) {
      return res.status(200).json({
        success: true,
        message: "No product",
        products: [],
      });
    }
    res.status(200).json({
      success: true,
      message: "Got All products",
      products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ---------------------------
// GET SINGLE PRODUCT
// ---------------------------
Router.get("/product/:id", auth, allowRoles("admin", "employee"), async (req, res) => {
  try {
    const id = req.params.id;

    const product = await productModel.findById(id).populate("category");

    if (!product) {
      return res.status(200).json({
        success: true,
        message: "No product",
      });
    }

    res.status(200).json({
      success: true,
      message: "Got single products",
      product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ---------------------------
// UPDATE PRODUCT (PUT)
// ---------------------------
Router.put("/product/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, barcode, category, price, stock } = req.body;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Item not found",
      });
    }

    // 1. UNIQUE CHECK: Only check if the barcode is being changed
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await productModel.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Barcode already exists! Cannot update.",
        });
      }
    }

    const categoryIdToUse = category || product.category;
    const categoryfind = await categoryModel.findById(categoryIdToUse);

    if (!categoryfind) {
      return res.status(400).json({
        success: false,
        message: "No category",
      });
    }

    const productUpdate = await productModel.findByIdAndUpdate(
      id,
      {
        name: name !== undefined && name.trim() ? name.trim() : product.name,
        barcode: barcode || product.barcode,
        category: categoryIdToUse || product.category,
        categoryDetails: {
          name: categoryfind.name,
          description: categoryfind.description,
        },
        price: price || product.price,
        stock: stock ?? product.stock,
      },
      { new: true }
    );

    if (!productUpdate) {
      return res.status(400).json({
        success: false,
        message: "Cannot be updated",
      });
    }

    res.status(201).json({
      success: true,
      message: "Updated Successfully",
      productUpdate,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ---------------------------
// DELETE PRODUCT
// ---------------------------
Router.delete("/product/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const productDel = await productModel.findByIdAndDelete(id);

    if (!productDel) {
      return res.status(400).json({
        success: false,
        message: "Item not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = Router;