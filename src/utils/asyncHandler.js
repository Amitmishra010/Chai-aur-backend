 const asyncHandler=(requestHandler)=>{
// //promises wala bhi ho skta hai aur try catch wala bhi ham promises wala use karenge//return karna bhul gya tha
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
 }
export {asyncHandler}









//ye kuch nahi hamne ek wrapper function banaya hai jo har jagah use kar sake
// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code ||500).json({
//             success:false,
//             message: err.message
//         })
//     }
// }//high order functions hote hai