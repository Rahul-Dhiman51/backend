import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiRespose.js";
import { User } from '../models/user.model.js'
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async function (userId) {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        // console.log(accessToken)
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })  // So that mongoDB does not validate the data before saving if it validates it will throw an error

        return { accessToken, refreshToken }

    } catch (error) {
        throw new apiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })

    ///////Steps to register a user
    // step1- get user details from frontend
    // step2- validation - not empty
    // step3- check if user already exists: username, email
    // step4- check for images, check for avatar
    // step5- upload them to cloudinary, avatar
    // step6- create user object - create entry in db
    // step7- remove password and refresh token field from response
    // step8- check for user creation
    // step9- return res

    //step1-
    // console.log(req.body)
    const { fullName, email, username, password } = req.body

    //step2-
    // console.log("email ", email)
    // if (fullName === "") {
    //     throw new apiError(400, "fullName")
    // }        /// Inefficient method as we have write a lot of if else

    //efficient method is using .some() method from js
    if ([fullName, email, username, password].some((field) => (field?.trim() === ""))) {
        throw new apiError(400, "All fields are required")
    }

    //step3-
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]  // want to check if username is also not taken by someone so here it will check if username as well as email is not used by another existing user.
    })

    if (existedUser) {
        throw new apiError(409, "User with email or username already exists")
    }

    //step4-
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // coverImage is not a required field so if no coverImage is uploaded from the client and we are checking it here so it will through and type error as follows...
    //TypeError: Cannot read properties of undefined (reading '0')
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }

    //step5-
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avatar file is required")
    }

    //step6-
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    })

    //step7-
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    //step8-
    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user")
    }

    //step9-
    return res.status(200).json(
        new apiResponse(200, createdUser, "User registered Successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {

    //step1- get user details from frontend
    //step2- validate the details - not empty
    //step3- check if the user exists with that email or username
    //step4- check if the password entered is correct
    //step5- generate access_token and refresh_token
    //step6- send the cookie with tokens to the frontend

    //step1-
    const { email, username, password } = req.body;
    // console.log(req.body)
    if (!(username || email)) {
        throw new apiError(400, "username or password is required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!existedUser) {
        throw new apiError(404, "User does not exist")
    }

    const isPasswordValid = await existedUser.isPasswordCorrect(password)   // this method is defined by us in the schema so it is only available in the instance existedUser not the User model...keep that in mind.
    if (!isPasswordValid) {
        throw new apiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existedUser._id)

    const loggedInUser = await User.findById(existedUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }   //by default cookies are modifyable in frontend by enabling these options they can only be modified at server, still visible at frontend.

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    // console.log(req.user)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new apiError(401, "Invalid refresh token")
    }

    if (user?.refreshToken !== incomingRefreshToken) {
        throw new apiError(401, "Refresh token is expired or used")
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user?._id)

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new apiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed"
            )
        )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmpassword } = req.body

    const user = User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (newPassword !== confirmpassword) {
        throw new apiError(400, "Password and confirm password do not match")
    }
    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new apiResponse(200, {}, "Passwor changed successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return req
        .status(200)
        .json(
            new apiResponse(200, req.user, "Current user fetched successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (fullName && email) {
        throw new apiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new apiResponse(200, user, "Account details updated successfully")
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    // console.log(avatarLocalPath)

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError(400, "Error while uploading on avatar")
    }

    const deletePreviousAvatar = await deleteOnCloudinary(req.user?.avatar)
    // console.log(deletePreviousAvatar)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    console.log(user)

    return res
        .status(200)
        .json(
            new apiResponse(200, user, "Avatar is updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading on cover image")
    }

    if (req.user?.coverImage) {
        const deletePreviousCoverImage = await deleteOnCloudinary(req.user?.coverImage)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new apiResponse(200, user, "Cover image is updated successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.username

    if (!username?.trim()) {
        throw new apiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            // match is used to filter the data from the collection and it is used as the first stage in the pipeline
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // lookup is used to join the data from another collection and it is used as the second stage in the pipeline
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subcribedTo"
            }
        },
        {
            // addFields is used to add new fields to the document and it is used as the third stage in the pipeline
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subcribedTo"
                },
                isSubscribed: {
                    $cond: {
                        // in is used to check if the value is present in the array or object both.
                        // Here we are checking that the logged in user is present in the subscribers array or not
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // project is used to select the fields from the document and it is used as the fourth stage in the pipeline
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new apiError(404, "Channel does not exist")
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, channel[0], "User channel fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            // req.user._id returns a string but mongo Object id is "ObjectId('xyz..')". When we make a request to database mongoose behind the scene handles it and converts that string into mongo object id.
            //  In pipelines it does not happen behind the scenes so we have to do it manually using mongoose.
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUserAvatar, updateUserCoverImage, getUserChannelProfile }