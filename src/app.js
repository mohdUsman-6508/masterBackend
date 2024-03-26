import express, { urlencoded } from "express";
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

//import of routes
import userRouter from "./routes/user.routes.js";

//routes declaration

app.use("/api/v1/users", userRouter);

// http://localhost:7000/api/v1/users/

export { app };
