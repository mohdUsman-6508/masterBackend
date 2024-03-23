import multer from "multer";

// we are using it to store files in local storage (local server)
//files are coming from frontend (userside through form etc.)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
