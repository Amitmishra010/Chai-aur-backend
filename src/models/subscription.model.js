import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"


const  subscriptionSchema=new Schema(
    {
        subscriber:{
            type:Schema.Types.ObjectId,//one who is subscribing
            ref:"User"
        },
        channel:{
            type:Schema.Types.ObjectId,//one whom channel is subscribing
            ref:"User"
        }
    },{
        timestamps:true
    }
)
export const Subscription=mongoose.model("Subscription",subscriptionSchema)