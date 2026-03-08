
import express from "express"
import Medicine from "../models/Medicine.js"

const router = express.Router()

router.get("/",async(req,res)=>{
const data = await Medicine.find()
res.json(data)
})

router.post("/",async(req,res)=>{
const item = await Medicine.create(req.body)
res.json(item)
})

export default router
