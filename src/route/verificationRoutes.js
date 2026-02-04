
import express from "express";
import {
    submitVerification,
    getVerificationStatus,
    getAllVerifications,
    updateVerificationStatus,
    getPendingVerificationsCount
} from "../controllers/verificationController.js";
import protectedRoutes from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMedia.js";

const router = express.Router();

// Seller Routes
router.post(
    "/verification/submit",
    protectedRoutes(["user", "business"]),
    upload.fields([
        { name: 'document_front', maxCount: 1 },
        { name: 'document_back', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    submitVerification
);

router.get(
    "/verification/status",
    protectedRoutes(["user", "business"]),
    getVerificationStatus
);

// Admin Routes (These could also go in adminRoutes.js, but keeping them here for feature cohesion)
router.get(
    "/admin/verifications",
    protectedRoutes("admin"),
    getAllVerifications
);

router.get(
    "/admin/verifications/count",
    protectedRoutes("admin"),
    getPendingVerificationsCount
);

router.post(
    "/admin/verification/:id/action",
    protectedRoutes("admin"),
    updateVerificationStatus
);

export default router;
