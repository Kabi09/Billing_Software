const mongoose=require("mongoose")

const productSchema=new mongoose.Schema({

    name:{
        type:String,
        required: true
    },

    barcode:{
        type:Number,
        required: true,
        unique:[true,"barcode is already taken"]
    },

    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "category", // Connect to Category model
        required: true
    },

     categoryDetails: {
      name:{type: String,
        required:true
      },
      description: String,
    },

    price:{
        type:Number,
        required:true
    },

    stock:{
        type:Number,
        default:0
    },
    sales:{
        type:Number,
        default:0
    },},
    

    
    {timestamps: true}


)


const productModel=mongoose.model("product",productSchema)

module.exports=productModel