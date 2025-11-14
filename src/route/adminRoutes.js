import express  from "express";
import { getAdminStats } from "../controllers/AdminController.js";

const router = new express.Router();

router.route('/')
.get(getAdminStats)

export default router;