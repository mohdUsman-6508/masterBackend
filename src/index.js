// require("dotenv").config({ path: "./env" });
import express, { urlencoded } from "express";
import connectToDatabase from "./db/index.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

///middlewares for best communication
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());
//////////////////////////////

//after connecting to DB, listening
connectToDatabase()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Listening at PORT: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("DB connection err: ", err);
  });
