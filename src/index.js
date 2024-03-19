//nodemon reload karega
// require("dotenv").config({ path: "./env" });

import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";
import connectToDatabase from "./db/index.js";

connectToDatabase();

console.log(process.env.MONGODB_URI);
console.log(DB_NAME);
