import express from "express";
import checkSubscription from '../middlewares/subscriptionMiddleware.js';
import protectedRoutes from "../middlewares/authMiddleware";
import {  createBusiness,getBusinessProfile,getBusinessProductsPost,addProductPost,updateProductPost,deleteProductPost} from '../controllers/businessController'

const router = express.Router();
router.post('/business/create-business',protectedRoutes('business'),createBusiness)
router.post('/business/add-product',protectedRoutes('business'),checkSubscription,addProductPost)
router.post('/business/update-product/:productId',protectedRoutes('business'),updateProductPost)
router.delete('/business/delete-product/:productId',protectedRoutes('business'),deleteProductPost)
router.get('/business/business-profile',protectedRoutes('business'),getBusinessProfile)
router.get('/business/business-products-post',protectedRoutes('business'),getBusinessProductsPost)