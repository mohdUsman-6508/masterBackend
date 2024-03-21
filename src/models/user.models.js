import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password required!"],
    },
    fullname: {
      type: String,
      required: true,
    },
    avatar: {
      type: String, //url from 3rd party (cloudinary)
      required: true,
    },
    coverImage: {
      type: String, //url from 3rd party (cloudinary)
    },

    watchHistory: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Video",
        },
      ],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export const User = new mongoose.model("User", userSchema);
