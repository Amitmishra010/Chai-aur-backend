import { ApiError } from "../utils/apiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser=asyncHandler(async (req,res)=>{
    //get user details from frontend ye ham pata karenge user model se ki kya kya chahiye hame
    //validation lagana padega like empty to nahi hai
    //check if user already exist: username,email
    //check for images,check for avatar
    //if availabel then upload on cloudinary,check avatar
    //create user object-mongodb is nosql database data object me hi store hota hai
    // remove password and refresh token field from response
    //check for user creation
    //return response
    const {fullName,email,username,password}=req.body
    console.log("email:",email)  
     //validation
     //Method1
    //  if(fullName==""){
    //     throw new ApiError(400,"fullname is required")
    //  }
    //Method2
    if ([fullName,email,username,password].some((field)=>field?.trim()==="")
    )
         {
        throw new ApiError(400,"All fields are required")
    }
    const existedUser=User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User is already exist")
    }
    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    //kyuki avatar ek required field hai agar nahi hogi to database crash karega to check kar lo ek baar
    if(!avatar){
        throw new ApiError(400,"Avatar nahi hai")
    }
     const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )
})  

export {registerUser}
//aap directly file handle nahi kar sakte ,data kar sakte hai handle