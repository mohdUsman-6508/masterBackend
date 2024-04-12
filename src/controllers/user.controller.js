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

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  const validUser = await User.findById(req.user?._id);
  const validPassword = await validUser.isPasswordCorrect(oldPassword);

  if (!validPassword) {
    throw new ApiError(401, "invalid password!");
  }

  validUser.password = newPassword;
  await validUser.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(200, {}, "Password changed Successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res, next) => {
  const { password, refreshToken, ...restUser } = req.user;
  return res
    .status(201)
    .json(new ApiResponse(200, { restUser }, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res, next) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(401, "fullName or email required!");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, updatedUser, "User updated successfully"));
});

const updateCurrentAvatar = asyncHandler(async (req, res, next) => {
  const avatarLocalPath = req.file.avatar;
  if (!avatarLocalPath) {
    throw new ApiError(401, "avatar is required!");
  }
  const uploadedAvatar = await upload(avatarLocalPath);
  if (!uploadedAvatar.url) {
    throw new ApiError(401, "error while uploading on cloudinary");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: uploadedAvatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, updatedUser), "Avatar updated successfully");
});

const updateCurrentCoverImage = asyncHandler(async (req, res, next) => {
  const coverImageLocalPath = req.file.coverImage;

  if (!coverImageLocalPath) {
    throw new ApiError(401, "cover image required");
  }

  const updatedCoverImage = await upload(coverImageLocalPath);
  if (!updateCurrentCoverImage.url) {
    throw new ApiError(401, "error while uploading on cloudinary");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: updatedCoverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, updatedUser, "Cover image updated"));
});

// aggregation pipelines --> a bit advance topic

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req?.params;
  if (!username?.trim()) {
    throw new ApiError(401, "username does not exist!");
  }

  //aggretion pipeline
  const channel = await User.aggregate([
    {
      //1 document find karliya stage I me
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", //model Subscription--> subscriptons in db
        $localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        $localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        //fields fo add kara rhe he document me iske baad project karenge
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },

        //subscribed he ya nahin uske liye calc

        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      //jo jo select karunga wahi dena
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1,
        channelsSubscribedToCount: 1,
      },
    },
  ]); //array return ho raha

  if (!channel?.length) {
    throw new ApiError(401, "channel not found!");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Users Channel fetched successfully!")
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  // req.user._id--> (ObjectId ko convert karna padega) -->se hame milega ek string, isse hum id lenge mongoose ka istemal karke
  // pipeline se data directly jata he mongodb ke pass mongoose bhayye ke through nahin jata

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.TypeObjectId(req.user._id),
      },
    },
    {
      //yahan par hamare pass bahut sare videos aa gye he
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //subpipeline
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
                    avatar: 1,
                    username: 1,
                  },
                },
              ],
            },
            //frontend ki sahuliyat ke liye
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },

            //yahan owner ke andar user ka sara data aagya he lekin hume specific data chahiye to hum yahan aur subpipeline lagayenge
          },
        ],
      },
      //yahan par subpipeline lagani padegi warna owners ka kuch nhin milega
    },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(201, user[0].watchHistory, "Watch history fetched!"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateCurrentAvatar,
  updateCurrentCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};

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
