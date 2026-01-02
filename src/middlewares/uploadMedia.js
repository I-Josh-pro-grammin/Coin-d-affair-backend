import cloudinary from "../config/cloudinary.js";
import pkg from 'multer-storage-cloudinary';
import multer from "multer";

console.log("DEBUG: uploadMedia.js loading attempt...");
console.log("DEBUG: pkg type:", typeof pkg);
console.log("DEBUG: pkg default present:", pkg && !!pkg.default);

// Support for different versions and CJS/ESM interop
let CloudinaryStorage;
if (typeof pkg === 'function') {
  CloudinaryStorage = pkg;
} else if (pkg && pkg.CloudinaryStorage) {
  CloudinaryStorage = pkg.CloudinaryStorage;
} else if (pkg && pkg.default && pkg.default.CloudinaryStorage) {
  CloudinaryStorage = pkg.default.CloudinaryStorage;
} else {
  CloudinaryStorage = pkg;
}

console.log("DEBUG: Final CloudinaryStorage constructor type:", typeof CloudinaryStorage);

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
