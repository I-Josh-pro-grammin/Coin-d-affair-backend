import pool from "../config/database.js";

const getAdminStats = async(req, res) => {
  
}

//Business Routes

const getAllBusinesses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM businesses`,
      []
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

const getBusinessProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT business_name,subscription_plan, total_orders,rating,total_sales FROM businesses where user_id=$1`,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteBusiness = async(req, res) => {
  const {userId} = req.params;

  try {
    const business = await pool.query(
      `DELETE FROM businesses where user_id=$1`,
      [userId]
    )
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

const getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT user_id, email, full_name, is_verified, account_type from users;`, []
    )

    res.status(200).json({
      users: users.rows
    });
  } catch (error) {
    console.log(error)
    throw new error("Failed to fetch users")
  }
}



export {
  getAdminStats,
  getBusinessProfile,
  getAllBusinesses,
  getAllUsers,
  deleteBusiness,
}