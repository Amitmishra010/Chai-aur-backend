//require('dotenv').config({path: './env}) //isse bhi kaam chal jayega kyuki ham chahte hai jab app load ho jitni jaldi ho sake hamare environment variable har jagah available ho jaye
//2nd approach
import dotenv from "dotenv" //phir config kar do


import connectDb from "./db/index.js";


dotenv.config({
    path:'./.env'
})

connectDb()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running at port:${process.env.PORT}`); 
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed",error);
    
})






// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
//connecting to database,ife method 1st approach 2nd is in db ki index.js
/*
(async()=>{

    try {
       await mongoose.connect(`${process.env.MONGODB_URI}`)
    } catch (error) {
        console.error("ERROR:",error)
        throw err
    }
})()
*/