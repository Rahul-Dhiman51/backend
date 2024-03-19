import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    quantity: {
        type: Number,
        required: true,
    },
})

const ordreSchema = mongoose.Schema({
    orderPrice: {
        required: true,
        type: Number,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    orderItems: {
        types: [orderItemSchema],
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Cancelled", "Delivered"],    // Restricting to get only one of these options
        default: "PENDING",
    }

}, { timestamps: true })

export const Order = mongoose.model("Order", ordreSchema)