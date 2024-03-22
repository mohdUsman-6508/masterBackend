import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { jsonwebtoken as jwt } from "jsonwebtoken";

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
    fullName: {
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

///password ke regarding hooks hum istemal kar rahe hain jaise- password ko store karane se pehle use hash kar rahe he , aur password ka validation bhi
userSchema.pre("save", async function (next) {
  if (!this.isModified) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
}); // this is a pre hook to hash the password from plain text

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}; // check password correctness

// token generation

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = new mongoose.model("User", userSchema);
