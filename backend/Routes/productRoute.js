const express=require("express")
const productModel = require("../models/productModel")
const categoryModel = require("../models/categoryModel")
const { auth, allowRoles } = require("../middleware/authMiddleware");


const Router=express.Router()


//add product
Router.post("/product", auth,
  allowRoles("admin"),async(req,res)=>{
    try{

        const{name,barcode,category,price,stock}=req.body
    
        if(!name.trim() || !barcode.trim() ||  price==null){
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        }


       if (price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price Value Incorrect", 
            });
        }
        
        // const categoryfind=await categoryModel.findById(category)
        
        
        





        let categoryData = null;

        // 3. LOGIC: Decide which Category to use
        if (category && category.trim() !== "") {
            // CASE A: User provided an ID. Let's verify it exists.
            categoryData = await categoryModel.findById(category);

            if (!categoryData) {
                return res.status(404).json({
                    success: false,
                    message: "The provided Category ID does not exist",
                });
            }
        } else {
            // CASE B: User did NOT provide an ID. Find or Create "None".
            categoryData = await categoryModel.findOne({ name: "None" });

            if (!categoryData) {
                // If "None" doesn't exist yet, create it automatically
                console.log("Creating default 'None' category...");
                categoryData = new categoryModel({
                    name: "None",
                    description: "Default category for uncategorized items"
                });
                await categoryData.save();
            }
        }



        
        const product= productModel({
            name,
            barcode,
            category: categoryData._id, 
            // Fill in the embedded details
            categoryDetails: {
                name: categoryData.name,
                description: categoryData.description},
            price,stock})
    
        await product.save()

        res.status(201).json({
            success:true,
            message:"Product add Successfully",
            product
        })
    }
    catch(err){
        res.status(404).json({
            success:false,
            message:err.message
        })
    }
    
})


//get All products

Router.get("/product", auth,
  allowRoles("admin", "employee"),async(req,res)=>{

    try{

        const products= await productModel.find().populate("category");

        if(!products){
            return res.status(200).json({
                success:true,
                message:"No product",
                products:[]
            })
        }
        res.status(200).json({
            success:true,
            message:"Got All products",
            products
        })

    }
    catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }

})

//get single product

Router.get("/product/:id", auth,
  allowRoles("admin", "employee"),async(req,res)=>{
    try{
        const id=req.params.id

        const product=await productModel.findById(id).populate("category")

        if(!product){
             return res.status(200).json({
                success:true,
                message:"No product"
            })
        }


         res.status(200).json({
            success:true,
            message:"Got single products",
            product
        })

    }
    catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }

})




//update product

Router.put("/product/:id", auth,
  allowRoles("admin"),async(req,res)=>{
    try{

        const id=req.params.id
        const{name,barcode,category,price,stock}=req.body

        const product=await productModel.findById(id)
        if(!product){
            return res.status(400).json({
                success:false,
                message:"Item no found"
            })
        }


        const categoryIdToUse = category || product.category;

        const categoryfind=await categoryModel.findById(categoryIdToUse)
        
        if(!categoryfind){
            return res.status(400).json({
                success:false,
                message:"No category"
            })
        }
        

        const productUpdate=await productModel.findByIdAndUpdate(id,{
            name:name!==undefined && name.trim() ? name.trim() : product.name,
            barcode:barcode || product.barcode,
            category:categoryIdToUse || product.category,
            categoryDetails:{
                name:categoryfind.name,
                description:categoryfind.description
            },
            price:price || product.price,
            stock:stock ?? product.stock


        },{new:true})

        if(!productUpdate){
            return res.status(400).json({
                success:false,
                message:"cannot be update"
            })
        }

        res.status(201).json({
            success:true,
            message:"Update Successfully",
            productUpdate
        })
   

        
    }
    catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }

})




// delete item

Router.delete("/product/:id", auth,
  allowRoles("admin"),async(req,res)=>{
    try{

        const id=req.params.id
        const productDel=await productModel.findByIdAndDelete(id)

        if(!productDel){
             return res.status(400).json({
                success:false,
                message:"Item not Found"
            })

        }

        res.status(200).json({
            success:true,
            message:"Deleted Successfully"
        })

    }
    catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }

})

module.exports=Router