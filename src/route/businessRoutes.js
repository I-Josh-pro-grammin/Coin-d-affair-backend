import express  from "express";
import { createBusiness, getAllBusinesses, getBusinessById } from "../controllers/BusinessController.js";

const router = new express.Router();

router.route('/')
.post(createBusiness)
.get(getAllBusinesses)

router.route('/:id')
.get(getBusinessById);

// router.route("/:id").get(updateBusinessDetails).delete(deleteBusiness);

export default router;