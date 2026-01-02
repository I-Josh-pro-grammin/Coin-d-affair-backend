import cloudinary from "../config/cloudinary.js";
import pkg from 'multer-storage-cloudinary';
const { CloudinaryStorage } = pkg;
import multer from "multer";

console.log("DEBUG: uploadMedia.js loaded");
console.log("DEBUG: Cloudinary object keys:", cloudinary ? Object.keys(cloudinary) : "undefined");
console.log("DEBUG: Cloudinary uploader present:", cloudinary && cloudinary.uploader ? "YES" : "NO");
console.log("DEBUG: CloudinaryStorage type:", typeof CloudinaryStorage);

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
