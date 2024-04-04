import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// here we are using a two step strategy-
//1.take file from user, store it at local server (locally store)
//2. then uplaod it at cloudinary from local server

const cloudinaryFileUpload = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      public_id: "",
      resource_type: "auto",
    });
    //file uploaded
    console.log("File has been uploaded at 'cloudinary' ", response.url);
    // fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    //if error happens in uploading then we will remove file from our local storage
    console.log(error);
    fs.unlinkSync(localFilePath);
    //remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

export default cloudinaryFileUpload;
