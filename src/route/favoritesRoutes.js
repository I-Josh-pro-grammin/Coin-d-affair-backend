import express from 'express';
import protectedRoutes from '../middlewares/authMiddleware.js';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/favoritesController.js';

const router = express.Router();

/**
 * Favorites endpoints
 */
// Allow any authenticated user to add favorites (not only business accounts)
router.post('/favorites', protectedRoutes(), addFavorite);
router.delete('/favorites/:listingId', protectedRoutes(), removeFavorite);
router.get('/favorites', protectedRoutes(), getFavorites);

export default router;
