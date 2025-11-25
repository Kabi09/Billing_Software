const express=require("express")
const categoryModel = require("../models/categoryModel")
const { auth, allowRoles } = require("../middleware/authMiddleware");
const Router=express.Router()

//create category
Router.post("/category", auth,
  allowRoles("admin"),async(req,res)=>{
    try{
        const{name,desc}=req.body

        
        if(!name.trim()){
           return res.status(400).json({
                success:false,
                message:"Category is Required"
            })
        }
        
        const category=categoryModel({
            name:name,description:desc
        })

        await category.save()

        res.status(201).json({
            success:true,
            message:"category add Successfully",
            category
        })


    }catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }

})

//get all category
Router.get("/category", auth,
  allowRoles("admin", "employee"),async(req,res)=>{
    try{

        const category=await categoryModel.find()

        if(!category.length){
              return res.status(200).json({
                success:true,
                message:"No Category",
                categories: [],
            })
        }

        res.status(200).json({
            success:true,
            message:"get All Category",
            category
        })

    }catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }

})


//get one category
Router.get("/category/:id",auth,
  allowRoles("admin", "employee"),async(req,res)=>{
    try{

        const id=req.params.id

        const category=await categoryModel.findById(id)
         if(!category){
           return res.status(400).json({
                success:true,
                message:"No category"
            })
        }
        res.status(200).json({
            success:true,
            message:"get one category ",
            category
        })


    }
     catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }


})



//update category

Router.put("/category/:id",auth,
  allowRoles("admin"),async(req,res)=>{
    try{
        const id=req.params.id
        const {name,desc}=req.body

        const category=await categoryModel.findById(id)
        if(!category){
           return res.status(400).json({
                success:true,
                message:"No category"
            })
        }

        const categoryUpdate=await categoryModel.findByIdAndUpdate(id,{
            name:name || category.name,
            description:desc || category.description

        },{new:true})


        if(!categoryUpdate){
            return res.status(400).json({
                success:false,
                message:"cannot be update"
            })
        }

        res.status(201).json({
            success:true,
            message:"Update Successfully",
            categoryUpdate
        })
   

    }
    catch(err){
         res.status(500).json({
            success:false,
            message:err.message
        })

    }

})





//delete category

Router.delete("/category/:id",auth,
  allowRoles("admin"),async(req,res)=>{
    try{

        const id=req.params.id
        const categoryDel=await categoryModel.findByIdAndDelete(id)

        if(!categoryDel){
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


