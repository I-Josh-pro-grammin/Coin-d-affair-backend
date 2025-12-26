import pool from "../config/database.js";

const getCustomers = async (req, res) => {
  const { fullName, email, password, accountType, phone } = req.body;
  try {
    const existingEmail = await pool.query(
      `SELECT user_id FROM users where email = $1`,
      [email]
    );

    return existingEmail;
  }catch(error) {
    console.log(error);
    return res.status(400).json({ message: "Failed to get customers" });
  }
}

const getCustomersNumber = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await pool.query(`SELECT user_id, email, full_name, phone, account_type, created_at FROM users WHERE user_id = $1`, [userId]);
    if (user.rowCount === 0) return res.status(404).json({ message: "User not found" });

    // fetch orders and listings summary
    const [orders, listings] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as total_orders, COALESCE(SUM(total_amount)::numeric,0) as total_spent FROM orders WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*)::int as total_listings FROM listings WHERE seller_id = $1`, [userId]),
    ]);

    return res.status(200).json({ user, orders, listings });
  } catch (err) {
    console.error("getUserDetails error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBusinessNumbers = async (req, res) => {
  try {
    const businesses = await pool.query("SELECT full_name FROM users WHERE account_type='business'", []);
    res.status(200).json({businesses: businesses.rows.length}); 
  } catch (error) {
    console.log(error);
    res.status(404).json({"message": "couldn't fetch the users number"});
  }
}

export {
  getCustomers,
  getCustomersNumber, 
  getBusinessNumbers
};