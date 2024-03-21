import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()     ///Don't know why dotenv is not accessible in this file so explicitly importing and configuring it here to work.

// console.log(dotenv.config())

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
// cloudinary.config({
//     cloud_name: 'daaacgwbq',
//     api_key: '452179232196224',
//     api_secret: 'CDI00l8IxL3gUyiGmTuGfSTwLDE',
//     secure: true,
// });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //uploading the file on cloudinary
        // console.log(cloudinary.config());
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary ", response.url);
        // console.log(response)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)    //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary }