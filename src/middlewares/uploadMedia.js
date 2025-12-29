import { v2 as cloudinary } from "cloudinary";
import CloudinaryStorage from "multer-storage-cloudinary";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    resource_type: "auto",
    format: async (req, file) => (file.mimetype.includes("video") ? "mp4" : "jpg"),
    chunk_size: 6000000, // 6MB chunks for better reliability
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

export default upload;
