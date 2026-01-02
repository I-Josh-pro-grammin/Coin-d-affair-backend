import cloudinary from "../config/cloudinary.js";
import pkg from 'multer-storage-cloudinary';
const CloudinaryStorage = pkg.CloudinaryStorage || pkg;
import multer from "multer";

console.log("DEBUG: uploadMedia.js loaded");
console.log("DEBUG: CloudinaryStorage constructor:", typeof CloudinaryStorage);
console.log("DEBUG: pkg keys:", Object.keys(pkg));

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // Explicitly allow only these formats
    public_id: (req, file) => file.fieldname + '-' + Date.now(),
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

export default upload;