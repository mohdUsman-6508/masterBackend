import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "A+ code",
  });
});

const user = asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    message: "user",
  });
});

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

export { registerUser, user };
