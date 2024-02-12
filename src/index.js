// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=> {
    
    app.on("error", (error)=>{
        console.log("ERR: ", error);
        throw console.error();
    })

    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is runnig at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed !!! ",err);
})


/*

IIFE (Immediately invoked functional expression) is used with a semicolon in start....just for cleaning purpose as
if there is code above this IIFE it can create problems...
Just a good practice used in industry

Below is one method to initialise the db in index.js itself but prefered
to write in separate db folder just to isolate similar code base
...Again a good and cleaner practice.


import express from "express";
const app = express();

...........DB is mostly in another continent so it is a good practice
to use async and await for database to connect

;( async () => {
    try{
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        
        ...........app.on is used to check if the app is properly talking with
            database or there is any error.. if there is it will throw one.
        
        app.on("error", (error)=>{
            console.log("ERROR: ",error);
            throw error
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        });
    } catch(error){
        console.log("ERROR: ",error)
        throw error
    }
})()
*/