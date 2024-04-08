import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import upload from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/// a very advance and professional way of making a controller

// ALGORITHM
//1. get user details form frontend
//2. validation- not empty
//3. check if user already exists:username, email
//4. check for images, check for avatar
//5. upload them to cloudinary, avatar
//6. create user object-create entry in db
//7. remove password and refresh token field from response
//8. check for user creation
//9. return res

//TODO: methods--[].some(), select( "-notrequired -onemore")

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { fullName, username, email, password } = req.body;
  console.log(username, email);

  if (fullName === "" || username === "" || email === "" || password === "") {
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

  //multer se aa rahe he
  const avatarLocalPath = req.files?.avatar[0]?.path; //TODO:req.files log it on console
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;//error de raha

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar field is required!");
  }

  //cloudinary par upload kara rahe
  const avatar = await upload(avatarLocalPath);
  const coverImage = await upload(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong!, while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered successfully"));
});

/// is method ki jarurat bahut baar padne wali hai
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong,tokens not generated!");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //req.body se data lo
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie

  const { username, password, email } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required!");
  }

  const validUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!validUser) {
    throw new ApiError(404, "User not found!");
  }

  const validPassword = await validUser.isPasswordCorrect(password);
  // const validPassword = await bcrypt.compare(password, validUser.password);

  if (!validPassword) {
    throw new ApiError(401, "Invalid Credentials!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    validUser._id
  );

  const loggedInUser = await User.findById(validUser._id).select(
    "-password -refreshToken"
  ); //optional step do if calling db is not expensive operation

  const options = {
    httpOnly: true,
    secure: true,
    //sirf server se he modifieable he
  };
  res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .status(201)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully:)"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //algorithm--->
  //get incoming refreshtoken from body or cookies
  //check if it is exist in db
  // if exist then generate an access token and send it in res as cookie
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorised request!");
    }

    //yahan par jo req.body se token aaya he aut jo hamre db me hai done alag he to isliye pehle jo token req.body ya cookie me aaya hai use decoded karna padega secret key se, kyonki wo encoded hai
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const isValidUser = await User.findById(decodedToken?._id);

    if (!isValidUser) {
      throw new ApiError(401, "Invalid refresh Token!");
    }

    if (incomingRefreshToken !== isValidUser?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    } ///TODO: ye error de sakta he

    const loggedInUser = await User.findById(isValidUser._id).select(
      "-password -refreshToken"
    );
    const { accessToken, newRefreshToken } =
      await isValidUser.generateAccessAndRefreshTokens(isValidUser._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .status(201)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token Refreshed successfully:)"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };

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
