import mongoose, { mongo } from "mongoose";

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    addressLine1: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,   //international picode can have character in them too
        required: true,
    },
    specializedIn: [
        {
            type: String,
        }
    ],

}, { timestamps: true })

export const Hospital = mongoose.model("Hospital", hospitalSchema)