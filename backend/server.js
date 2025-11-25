const express=require("express")
const mongoose=require("mongoose")
const dotenv=require("dotenv")
const cors=require("cors")




const demo=require("./Routes/demo")
const categoryRoute=require("./Routes/categoryRoute")
const productRoute=require("./Routes/productRoute")
const orderRoute=require("./Routes/orderRoute")
const dashboard=require("./Routes/dashboardRoute")
const authRoute  = require("./Routes/authRoute")



dotenv.config({path:"./.env"})

const app=express()
app.use(express.json())
app.use(cors())

app.use("/",demo)
app.use("/api/auth", authRoute);
app.use("/api",categoryRoute,productRoute,orderRoute,dashboard)



mongoose.connect(process.env.DBurl)
.then(()=>console.log("DB connected Successfully"))
.catch((err)=>console.log("DB not Connected"))

app.listen(process.env.PORT,()=>console.log("server is Running Port:",process.env.PORT))
