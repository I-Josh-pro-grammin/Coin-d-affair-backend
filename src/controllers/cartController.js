import pool from '../config/database.js';

const createCart = async (req, res) => {
  const { user_id, session_token } = req.body;

  try {
    const { rows: existing } = await pool.query(
      'SELECT cart_id FROM carts WHERE user_id = $1;',
      [user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "You already have a cart!" });
    }

    await pool.query(
      'INSERT INTO carts (user_id, session_token) VALUES ($1, $2);',
      [user_id, session_token]
    );

    res.status(201).json({ message: "Cart created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sorry, we had an error creating the cart" });
  }
};

const addItemToCart = async (req, res) => {
  const { cart_id, listing_id, sku_item_id, quantity, price_at_add } = req.body;

  try {
    await pool.query(
      `INSERT INTO cart_items (cart_id, listing_id, sku_item_id, quantity, price_at_add)
       VALUES ($1, $2, $3, $4, $5);`,
      [cart_id, listing_id, sku_item_id, quantity, price_at_add]
    );

    res.status(201).json({ message: "Item added to cart successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sorry, unable to add item to cart!" });
  }
};

const getCart = async (req, res) => {
  const { cart_id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT user_id, session_token, created_at FROM carts WHERE cart_id = $1;',
      [cart_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.json({ cart: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching cart" });
  }
};

const getCartItem = async (req, res) => {
  const { cart_item_id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT quantity, price_at_add FROM cart_items WHERE cart_item_id = $1;',
      [cart_item_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ cartItem: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching cart item" });
  }
};

const removeItemFromCart = async (req, res) => {
  const {cart_item_id} = req.params;
  try {
    await pool.query(`
      DELETE FROM cart_items where cart_item_id = $1
    `, [cart_item_id])
  
    res.status(200).json({
      message: "Cart item was successfully removed"
    })

  } catch (error) {
    res.status(500).json({
      error: "Unable to remove item"
    })
  }
}

export {
  createCart,
  addItemToCart,
  getCart,
  getCartItem,
  removeItemFromCart
};
