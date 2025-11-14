import express from "express";
import protectedRoutes from "../middlewares/authMiddleware.js";
import { createCategory, createSubCategory, getCategory, getSubCategory } from "../controllers/categoryController.js";

const router = express.Router();

router.post('/category/create-category',protectedRoutes('admin'),createCategory)
router.get('/category/get-category',protectedRoutes(["admin","business"]),getCategory)
router.post('/category/create-subcategory',protectedRoutes('admin'),createSubCategory)
router.get('/category/get-subcategory',protectedRoutes(["admin","business"]),getSubCategory)
export default router;