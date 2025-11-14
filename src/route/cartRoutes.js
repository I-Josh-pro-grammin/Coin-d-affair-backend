import express from 'express';
import {
  createCart,
  addItemToCart,
  getCart,
  getCartItem,
  removeItemFromCart
} from '../controllers/cartController.js';

const router = express.Router();

router.post('/', createCart);
router.post('/item', addItemToCart);
router.get('/:cart_id', getCart);
router.get('/item/:cart_item_id', getCartItem);
router.delete('/item/:cart_item', removeItemFromCart);

export default router;
