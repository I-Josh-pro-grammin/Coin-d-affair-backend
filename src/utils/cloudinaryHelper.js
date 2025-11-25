import cloudinary from "../config/cloudinary.js";

/**
 * Validate video duration on Cloudinary
 * @param {string} publicId
 * @param {number} maxSeconds
 */
export const validateVideoLength = (publicId, maxSeconds = 60) => {
  return new Promise((resolve, reject) => {
    cloudinary.api.resource(publicId, { resource_type: "video" }, (err, result) => {
      if (err) return reject(err);
      if (!result || typeof result.duration === "undefined") {
        return reject(new Error("Unable to get video metadata"));
      }
      if (result.duration > maxSeconds) {
        return reject(new Error(`Video exceeds ${maxSeconds} seconds`));
      }
      resolve(true);
    });
  });
};