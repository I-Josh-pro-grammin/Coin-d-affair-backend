import pool from "../config/database.js";

const createBusiness = (req, res) => {
  const {user_id, business_name, vat_number, subscription_plan, is_paid} = req.body;
  const values = [
    user_id, business_name, vat_number, subscription_plan, is_paid
  ];

  try {
    const qry = pool.query(`INSERT INTO businesses(user_id, business_name, vat_number, subscription_plan, is_paid) VALUES ($1, $2, $3, $4, $5);`, values );
    console.log("Its over");
    return res.status(201).json({
      "message": "business created successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Failed to create business")
  }
}

const getAllBusinesses = async(req, res) => {
  try {
    const businesses = await pool.query(`SELECT * FROM businesses;`, []);
    res.status(200).json({
      "Businesses": businesses.rows
    })
  } catch (error) {
    res.status(404).json("Failed to fetch businesses")
  }
}

const getBusinessById = async (req, res) => {
  const {id} = req.params;
try {
  const business = await pool.query(`SELECT * FROM businesses WHERE business_id = $1;`, [id]);
  res.status(200).json({
    "business": business.rows
  });
} catch (error) {
  console.log(error)
  res.status(401).json({
    "message": "Business not found"
  })
}  
}

export {
  createBusiness,
  getAllBusinesses,
  getBusinessById
}