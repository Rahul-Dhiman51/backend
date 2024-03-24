import express from "express";
import cookieParser from "cookie-parser";   //Used to perform CRUD operation on the cookies stored in browser.
// There are some secure cookies that only server can read and write.
import cors from "cors";
import dotenv from "dotenv"

const app = express();

//newer version of express we don't have to install bodyParser as
//it is already taken care of inbuilt
//but in previous versions we had to install bodyParser and configure it.

//There is multer library for handle uploading data/files...

// ".use()" method is used when we want to use some middleware or add some configurations

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))  //data comes from url and from frontend are mostly in json format
//and we don't want our server to crash so limit that incoming req or res size.

app.use(express.urlencoded({ extended: true, limit: "16kb" })) //In url the space are converted as "+" or "%20"
// to overcome that issue or encoded url. It is used. extended means nested objects are allowed

app.use(express.static("public"))   //Used to store some data like images, favicon or anything
//that i want to be stored in the server itself. It will create a static space/folder in the server.

app.use(cookieParser())


///////routes import
import userRouter from './routes/user.route.js'

//routes declaration
app.use('/api/v1/users', userRouter)

export { app }