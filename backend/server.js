
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import medicineRoutes from "./routes/medicineRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

mongoose.connect("mongodb://127.0.0.1:27017/pharmacy")

app.use("/api/medicines",medicineRoutes)

app.listen(5000,()=>{
console.log("Server running on port 5000")
})
