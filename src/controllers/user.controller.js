import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiRespose.js";
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

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
    if (req.files && Array.isArray(req.files.coverImage) && registerUser.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.avatar[0].path;
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

export { registerUser, loginUser, logoutUser, refreshAccessToken }