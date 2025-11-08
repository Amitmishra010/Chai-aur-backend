import { ApiError } from "../utils/apiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subscription.model.js"
import mongoose from "mongoose"
const generateAccessandRefreshToken=async (userId)=>{
    try {
      const user=  await User.findById(userId)
      const accessToken=await user.generateAccessToken()
      const refreshToken=await user.generateRefeshToken()

      user.refreshToken=refreshToken
      user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating tokens")
    }
}



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
    const {fullname,email,username,password}=req.body
    console.log("email:",email) 
    console.log("fullname:",fullname)
     console.log("username:",username)
     console.log("password:",password)   
     //validation
     //Method1
    //  if(fullName==""){
    //     throw new ApiError(400,"fullname is required")
    //  }
    //Method2
    if ([fullname,email,username,password].some((field)=>field?.trim()==="")
    )
         {
        throw new ApiError(400,"All fields are required")
    }
    const existedUser=await User.findOne({
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
        fullname,
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

const loginUser=asyncHandler(async (req,res)=>{
//steps-> req.body se data le aao
//username or email
//find the user
//password check
//access and refresh token
//send in cookies
//

const {email,username,password}=req.body
if(!(username ||email)){
    throw new ApiError(400,"username or password is required")
}
   const user =await User.findOne({
    $or:[{username},{email}]
})
if(!user){
    throw new ApiError(404,"user does not exist");
}
const isPasswordValid=await user.isPasswordCorrec(password)
if(!isPasswordValid){
    throw new ApiError(401,"password is not valid")
}
//access and refresh token banane ka kaam common hai to iske liye ek seperate file banao

const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)
const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
//ab cookies bhejne ke liye options banane hoge
const options={
    httpOnly:true,
    secure:true
}
return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user:  loggedInUser,accessToken,refreshToken
        },
        "user logged in successfully"
    )

    
)

})
const logoutUser=asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
    httpOnly:true,
    secure:true
}
return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"user logged out"))

})
//refresh access token endpoint
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
   try {
    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user= await User.findById(decodedToken?._id)
 
    if(!user){
     throw new ApiError(401,"invalid refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401,"refresh token is expired or used")
    }
 
    const options={
     httpOnly:true,
     secure:true
    }
    const {accessToken,newRefreshToken}=await generateAccessandRefreshToken(user._id)
    //ab response bhej denge
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
     new ApiResponse(
         200,
     {accessToken,refreshToken:newRefreshToken},
     "access token refreshed"
 
     )
     
    )
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
   }

})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user= await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"password is not correct")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))


})
const getCurrentUser=asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetched successfully")
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user=User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname,
            email:email
        }
        
    },{new:true}).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"account details updated successfully"))
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar=   await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"error while uploading on avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200)
    .json(
        new ApiResponse(200,user,"avatar updated successfully")
    )
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }
    const coverImage=  await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"error while uploading on coverImage")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params//jab hame kisi channel ki profile chahiye hoti hai to ham us channel ke url pe jate hai ->user.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
   const channel= await User.aggregate([//aggregation ke baad data hame array me milta hai
    //first pipeline
    {
        $match:{
            username:username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
        $lookup:{
             from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
    },
//yahan tak dono field hamare pass aa chuke hai ab hame dono ko add bhi karna hai
    {
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"//iske sath $ use karna hai kyuki ye field hai ab
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            fullname:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1
        }
    }

   ])
   console.log("channel",channel);
   if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
   }
   return res.status(200)
   .json(new ApiResponse(200,channel[0],"user channel fetched successfully"))
})
const getWatchHistory=asyncHandler(async (req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory" ,
                //yahan tak ab hamare paas bahut sare documents(videos) aa chuke honge ,aur ab ownners ke liye subpipeline lagayenge(nested)
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
//aap directly file handle nahi kar sakte ,data kar sakte hai handle