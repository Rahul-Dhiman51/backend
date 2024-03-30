import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: "avatar", // These names should be same as used in frontend form
            maxCount: 1,
        }, {
            name: 'coverImage',
            maxCount: 1
        },
    ]), registerUser);

router.route('/login').post(loginUser);

//SECURED ROUTES
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/update-profile/avatar').post(verifyJWT, upload.single('avatar'), updateUserAvatar)
router.route('/update-profile/coverImage').post(verifyJWT, upload.single('coverImage'), updateUserCoverImage)

export default router