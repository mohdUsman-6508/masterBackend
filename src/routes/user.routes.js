import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

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

export default router;
