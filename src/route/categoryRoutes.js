import express  from "express";
import { createCategory, createSubCategory, getCategory, getSubCategory } from "../controllers/categoryController.js";

const router = express.Router()

router.route('/').post(createCategory).get(getCategory)
router.route('/sub-category/').post(createSubCategory).get(getSubCategory)
router.route('/').get()

export default router