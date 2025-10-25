import express  from "express";
import { createBusiness, getAllBusinesses } from "../controllers/BusinessController.js";

const router = new express.Router();

router.route('/')
.post(createBusiness)
.get(getAllBusinesses)
// .get(getBusiness);

// router.route("/:id").get(updateBusinessDetails).delete(deleteBusiness);

export default router;