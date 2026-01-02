import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    // Enforce image only
    resource_type: 'image',
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    public_id: (req, file) => file.fieldname + '-' + Date.now(),
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Strictly allow only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

export default upload;
