import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { username, email, password } = req.body;
  console.log(username, email);

  if (username === "" || email === "" || password === "") {
    throw new ApiError(400, "All fields are required!");
  }
  // if ([username, email, password].some((field) => field?.trim === "")) {
  //   throw new ApiError(400, "All fields are required!");
  // } // more advance code for above same logic
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with this username or email already exist!!!"
    );
  }
});

export { registerUser };

// Another way of writing above controller

// const register = async (req, res) => {
//   try {
//     res.status(200).json({
//       success: true,
//       message: "working",
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//     });
//   }
// };
// const user = asyncHandler(async (req, res) => {
//   res.status(201).json({
//     success: true,
//     message: "user",
//   });
// });
