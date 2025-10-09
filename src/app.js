import express from "express"
import cookieParser from "cookie-parser"//(basically CRUD operation)iska kaam bas itna sa hai ki mai mere server se jo user ka browser hai uski cookie set kar pau aur access kar pau

import cors from "cors"
const app=express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
//to middleware set karna padega
//ab kyuki data hamara kayi jagah se aa skta hai file,json,form,etc. jaise json aa raha hai to uski limit set karni hogi unlimited nahi kar sakte server crash ho jayega
app.use(express.json({limit:"16kb"}))
//jab url se data aata hai to thodi problem hoti hai kyuki wo encode karta hai data ko like space ko %20 kar deta hai koi koi + kar deta hai to uske liye batana padta hai express ko
app.use(express.urlencoded({extended:true,limit:"16kb"}))
//kayi baar ham kuch files,folder ya image ko local server per store karna chahte hai ki ye public assets hai
app.use(express.static("public")) 
app.use(cookieParser())


//routes
import userRouter from "./routes/user.routes.js"

//routes declaration
//app.use("/user",userRouter)//--> //yahan ke baad control seedhe pass ho gya hai user.routes me ab agar login karna ho to yahan kuch nahi karna change user.routes me karna hai
//dusra achi practice ye hai ki agar aap api define kar rahe hai to batana padta hai ki aap define kar rahe hai and versoning kya hai
app.use("/api/v1/user",userRouter)



export {app}