import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiRespose.js";
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export { registerUser }