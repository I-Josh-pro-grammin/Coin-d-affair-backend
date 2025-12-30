import express from "express";
import protectedRoutes from "../middlewares/authMiddleware.js";
import { createCategory, createSubCategory, getCategory, getSubCategory, getAllCategories, getSubcategoriesByCategorySlug, removeCategory } from "../controllers/CategoryController.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Category
 *     description: All category-related endpoints
 *
 * /api/category:
 *   get:
 *     summary: Get all categories with subcategories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: List of categories
 *
 * /api/category/create-category:
 *   post:
 *     summary: Create a new category (admin only)
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_name:
 *                 type: string
 *               slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *
 * /api/category/create-subcategory:
 *   post:
 *     summary: Create a new subcategory (admin only)
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: string
 *               subcategory_name:
 *                 type: string
 *               slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subcategory created
 *
 * /api/category/delete-category/{category_id}:
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 *
 * /api/category/slug/{categorySlug}/subcategories:
 *   get:
 *     summary: Get all subcategories for a category by slug
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: categorySlug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subcategories
 */
router.get('/category', getAllCategories)
router.post('/category/create-category', protectedRoutes('admin'), createCategory)
router.get('/category/get-category', protectedRoutes(["admin", "business"]), getCategory)
router.post('/category/create-subcategory', protectedRoutes('admin'), createSubCategory)
router.get('/category/get-subcategory', protectedRoutes(["admin", "business"]), getSubCategory)
router.delete('/category/delete-category/:category_id', protectedRoutes('admin'), removeCategory)
router.get('/category/slug/:categorySlug/subcategories', protectedRoutes(['admin', 'business']), getSubcategoriesByCategorySlug)
export default router;