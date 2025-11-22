import express from "express";
import checkSubscription from "../middlewares/subscriptionMiddleware.js";
import protectedRoutes from "../middlewares/authMiddleware.js";
import {
  createBusiness,
  getBusinessProductsPost,
  addProductPost,
  updateProductPost,
  deleteProductPost,
  updateBusiness,
  getBusinessTransactions,
} from "../controllers/businessController.js";
import upload from "../middlewares/uploadMedia.js"
import { getBusinessProfile } from "../controllers/AdminController.js";

const router = express.Router();
router.post(
  "/business/create-business",
  protectedRoutes("business"),
  createBusiness
);
router.patch("/business", protectedRoutes("business"), updateBusiness);
router.post(
  "/business/add-product",
  protectedRoutes("business"),
  upload.array("media",5),
  checkSubscription,
  addProductPost
);
router.post(
  "/business/update-product/:productId",
  protectedRoutes("business"),
  upload.array("media",5),
  updateProductPost
);
router.delete(
  "/business/delete-product/:productId",
  protectedRoutes("business"),
  deleteProductPost
);
router.get(
  "/business/business-profile",
  protectedRoutes("business"),
  getBusinessProfile
);
router.get(
  "/business/business-products-post",
  protectedRoutes("business"),
  getBusinessProductsPost
);
router.get(
  "/business/transactions",
  protectedRoutes("business"),
  getBusinessTransactions
);
export default router;
