import { v2 as cloudinary } from 'cloudinary'
import { response } from 'express';
import fs from 'fs'


cloudinary.config({
    cloud_name: 'CLOUDINARY_CLOUD_NAME',
    api_key: 'CLOUDINARY_API_KEY',
    api_secret: 'CLOUDINARY_API_SECRET'
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //uploading the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary ", response.url);
        console.log(response)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)    //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary }