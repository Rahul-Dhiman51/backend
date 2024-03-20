/////// If we don't want to explicitly write this wrapper function then simply we can import "import handler from "express-async-handler"; "

// Here we are creating wrapper functions to ease our life so that we don't have to write repeative
//code again n again for handling async calls.
///// when we use async functions we have write either .then().catch() or try{} catch{} to consume the promises or async calls
// as we don't have to write that repeative code of try and catch this wrapper is created

//First is Promise method...as DB connection returns promises.
//Second is using try n catch


const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((error) => next(error))
    }
}


export { asyncHandler }


// const asyncHandler = () => {}
// const asyncHandler = (func) => {()=>{}}
// const asyncHandler = (func) => ()=>{}
// const asyncHandler = (func) => async ()=>{}


//Try catch method to create wrapper function

// const asyncHandler = (func) => async (err, req, res, next)=>{
//     try {
//         await func(req,res,next)
//     } catch (error) {
//          res.status(error.code || 500).json({
//             message: error.message,
//             success: false
//         })
//     }
// }
