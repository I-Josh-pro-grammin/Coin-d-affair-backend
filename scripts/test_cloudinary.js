import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Check if env check passed
console.log("Checking Cloudinary Config...");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "EXISTS" : "MISSING");
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testConnection() {
    try {
        console.log("Attempting to list resources (ping)...");
        const result = await cloudinary.api.ping();
        console.log("✅ Cloudinary Connection Successful:", result);
    } catch (error) {
        console.error("❌ Cloudinary Connection Failed:", error.message);
        if (error.error) console.error("Details:", error.error);
    }
}

testConnection();
