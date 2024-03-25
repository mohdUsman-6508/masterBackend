// require("dotenv").config({ path: "./env" });

import connectToDatabase from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./env",
});

//////////////////////////////

//after connecting to DB, listening
connectToDatabase()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🛞  Listening at PORT: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("DB connection err: ", err);
  });
