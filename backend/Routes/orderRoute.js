const express=require("express")

const productModel = require("../models/productModel")
const orderModel=require("../models/orderModel")
const { auth, allowRoles } = require("../middleware/authMiddleware");


const Router=express.Router()


//create a order

Router.post("/order", auth,
  allowRoles("admin", "employee"),async(req,res)=>{
    try{

        const {customerName,products}=req.body

        if(!products || !products.length){
            return res.status(400).json({
                success:false,
                message:"Products Are Required"
            })
        }

        const last=await orderModel.findOne().sort({sno:-1})
        const newSno=last ? last.sno+1:1000;

        let buyProducts=[]
        let overallTotal=0


        for(const item of products){
            const {productId,quantity}=item
        



        const product=await productModel.findById(productId).populate("category")

        if(!product){
            return res.status(404).json({
                success:true,
                message:"product not Found"
            })
        }

        if(quantity == null || quantity <= 0){
            return res.status(404).json({
                success:true,
                message:"Quantity Required"
            })

        }

        const total=quantity*product.price
        overallTotal+=total

        buyProducts.push({
            productId:product._id,
            barcode: product.barcode,
            name:product.name,
            price:product.price,
            quantity,total,
            category:product.category._id,
            categoryDetails:{
                name:product.category.name,
                description: product.category.description,
            }


        })
        
    }



    const order = orderModel({
      sno: newSno,
      customerName:  customerName ? customerName.trim() : null,   // name not required
      products: buyProducts,
      overallTotal,
      date: new Date()
    });

    await order.save();
    
    for (const p of buyProducts){
         const dbProduct = await productModel.findById(p.productId);

         const newStock = dbProduct.stock - p.quantity;
         const finalStock = newStock < 0 ? 0 : newStock;

        await productModel.findByIdAndUpdate(p.productId,{
            $inc: {sales:p.quantity},
            $set: {stock: finalStock }
        },

            {new:true})
    } 

    res.status(201).json({
      success: true,
      message: "Order created",
      order,
    });

    }




    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        })
    }

})







//get all oreders

Router.get("/order", auth,
  allowRoles("admin", "employee"),async(req,res)=>{

    try{

        const orders=await orderModel.find()

        if(!orders.length){
            return res.status(200).json({
                success:true,
                message:"No orders",
                orders:[]
            })
        }

        res.status(200).json({
            success:true,
            message:"Get All orders",
            orders
        })

    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        })
    }

})



//get single order

Router.get("/order/:id", auth,
  allowRoles("admin", "employee"),async(req,res)=>{
    try{
        const id=req.params.id 
        const order=await orderModel.findById(id)
        if(!order){
            return res.status(404).json({
                success:false,
                message:"order not found",
            })
        }

        res.status(200).json({
            success:true,
            message:"get single Order",
            order

        })

    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        })
    }

})
Router.put("/order/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { customerName, products } = req.body;

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "No Order found" });
    }

    // Update customer name
    if (customerName && customerName.trim() !== "") {
      order.customerName = customerName.trim();
    }

    // Name only update
    if (!products || !products.length) {
      await order.save();
      return res.status(200).json({ success: true, message: "Name only is updated", order });
    }

    // ⭐ TRACK STOCK CHANGES
    const qtyChanges = []; // { productId, deltaQty }
    const finalProductList = []; // This will replace order.products

    // =========================================================
    // STEP 1: Handle REMOVED Products (Restore Stock)
    // =========================================================
    // Check if any product in the DB (order.products) is NOT in the new input (products)
    for (const oldItem of order.products) {
      const stillExists = products.find(
        (p) => p.productId.toString() === oldItem.productId.toString()
      );

      if (!stillExists) {
        // Product was removed!
        // deltaQty is negative of oldQty (so we add it back to stock later)
        // Example: OldQty was 5. We removed it. Stock should increase by 5.
        // Sales should decrease by 5.
        qtyChanges.push({
          productId: oldItem.productId,
          deltaQty: -oldItem.quantity, 
        });
      }
    }

    // =========================================================
    // STEP 2: Handle UPDATED & NEW Products
    // =========================================================
    for (const item of products) {
      const { productId, quantity } = item;

      if (!productId || quantity == null || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each product must have valid productId and quantity > 0",
        });
      }

      // Check if this product was already in the order
      const existingProduct = order.products.find(
        (p) => p.productId.toString() === productId.toString()
      );

      if (existingProduct) {
        // --------- EXISTING PRODUCT → UPDATE ----------
        const oldQty = existingProduct.quantity;
        const newQty = quantity;
        const deltaQty = newQty - oldQty;

        // Add to final list with updated values
        existingProduct.quantity = newQty;
        existingProduct.total = newQty * existingProduct.price;
        
        finalProductList.push(existingProduct); // Push the updated object
        qtyChanges.push({ productId, deltaQty });

      } else {
        // --------- NEW PRODUCT → ADD ----------
        const product = await productModel.findById(productId).populate("category");

        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }

        const total = quantity * product.price;

        finalProductList.push({
          productId: product._id,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity,
          total,
          category: product.category._id,
          categoryDetails: {
            name: product.category.name,
            description: product.category.description,
          },
        });

        // New item: delta is the full quantity
        qtyChanges.push({ productId: product._id, deltaQty: quantity });
      }
    }

    // =========================================================
    // STEP 3: Finalize & Save
    // =========================================================

    // Recompute overall total
    let newOverallTotal = 0;
    for (const p of finalProductList) {
      newOverallTotal += p.total || 0;
    }

    // ⭐ Replace the old list with the NEW list completely
    order.products = finalProductList;
    order.overallTotal = newOverallTotal;

    await order.save();

    // =========================================================
    // STEP 4: Update Product Stock / Sales
    // =========================================================
    for (const change of qtyChanges) {
      const { productId, deltaQty } = change;

      // Skip if no change (e.g. user sent same quantity)
      if (deltaQty === 0) continue;

      const dbProduct = await productModel.findById(productId);
      if (!dbProduct) continue;

      // Calculate new stock
      // If deltaQty is POSITIVE (Sold more): Stock decreases
      // If deltaQty is NEGATIVE (Returned/Removed): Stock increases (minus minus becomes plus)
      const newStock = dbProduct.stock - deltaQty;
      const finalStock = newStock < 0 ? 0 : newStock;

      await productModel.findByIdAndUpdate(productId, {
        $inc: { sales: deltaQty }, 
        $set: { stock: finalStock },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});



//order delete
Router.delete("/order/:id", auth,
  allowRoles("admin"),async(req,res)=>{

    try{
        const id=req.params.id

        const order=await orderModel.findByIdAndDelete(id)

        if(!order){
            return res.status(404).json({
                success:false,
                message:"order not found"
            })
        }

        res.status(201).json({
            success:true,
            message:"Order delete successfully"
        })

    }catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
})


module.exports=Router