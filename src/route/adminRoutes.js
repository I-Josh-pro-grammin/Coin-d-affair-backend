import express  from "express";
import { getAdminStats, getAllUsers } from "../controllers/AdminController.js";

const router = new express.Router();

router.route('/')
.get(getAdminStats)

router.get('/users', getAllUsers)


export default router;