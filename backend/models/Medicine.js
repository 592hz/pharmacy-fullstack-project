
import mongoose from "mongoose"

const medicineSchema = new mongoose.Schema({

name:String,
price:Number,
stock:Number,
supplier:String,
expiryDate:Date

},{timestamps:true})

export default mongoose.model("Medicine",medicineSchema)
