const mongoose = require("mongoose")

const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:true
    },
    description:String},{ timestamps: true }
)

const CategoryModel=mongoose.model("category",categorySchema)

module.exports=CategoryModel