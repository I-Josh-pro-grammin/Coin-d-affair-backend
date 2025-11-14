import express from 'express';
import {
  createCart,
  addItemToCart,
  getCart,
  getCartItem,
  removeItemFromCart
} from '../controllers/cartController.js';

const router = express.Router();

router.post('/cart/create-cart', createCart);
router.post('/cart/add-item-to-cart', addItemToCart);
router.get('/cart/get-cart/:cart_id', getCart);
router.get('/cart/get-cart-item/:cart_item_id', getCartItem);
router.delete('/cart/remove-item/:cart_item', removeItemFromCart);

export default router;