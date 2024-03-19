import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";

dotenv.config({ path: "./.env" });

const connectToDatabase = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(connectionInstance.connection.host);
    console.log("DB CONNECTED!");
  } catch (err) {
    console.log(err);
    console.log("MongoDB connection error!!");
    throw err;
  }
};

export default connectToDatabase;
