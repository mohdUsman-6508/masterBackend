//nodemon reload karega
import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";

const app = express();

// (async () => {
//   try {
//     const db = await mongoose.connect(
//       `${process.env.MONGODB_URI}/${DB_NAME}` && "mongodb://localhost:27017",
//       { dbName: "MYTUBE" }
//     );
//     console.log(db);
//     console.log("DB connectecd!");
//     app.on("error", (error) => {
//       console.log("ERROR", error);
//       throw error;
//     });

//     app.listen(process.env.PORT || 3000, () => {
//       console.log(`Listening at port: ${process.env.PORT || 3000} `);
//     });
//   } catch (err) {
//     console.log("ERROR:", err);
//     throw err;
//   }
// })();

// (() => {})();

(async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017", {
      dbName: "MYTUBE",
    });
    console.log("DB connected!");
    app.on("error", (err) => {
      console.log(err);
      throw err;
    });
    app.listen("5000", () => {
      console.log("listening at port 5000");
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
})();

app.get("/", (req, res) => {
  res.send("Working");
});
