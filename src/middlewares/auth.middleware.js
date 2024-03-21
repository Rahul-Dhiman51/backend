import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

// Sometimes in place of res _ is used when res is not used
// like this (req, _, next) => {}
export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    // it is a practice to send Authorization in header as "Authorization: Bearer <token>" source: https://jwt.io/introduction

    if (!token) {
        throw new apiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (!user) {
        throw new apiError(401, "Invalid Access Token")
    }
    req.user = user;
    next()
})