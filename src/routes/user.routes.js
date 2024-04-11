import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateCurrentAvatar,
  updateCurrentCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  //middleware add kar diya hai ye
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

///// secured routes /////

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

//TODO: Postman API testing
router.route("/change-passoword").post(changeCurrentPassword);
router.route("/get-current-user").get(getCurrentUser);
router.route("/update-account-details").post(updateAccountDetails);
router.route("/update-avatar").post(updateCurrentAvatar);
router.route("/update-coverimage").post(updateCurrentCoverImage);

export default router;
