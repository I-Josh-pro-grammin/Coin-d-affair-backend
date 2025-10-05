import pool from "../config/database.js";

const createListing = async (req, res) => {
  const user = req.user;
  try {
    const {
      categoryId,
      subcategoryId,
      title,
      description,
      price,
      currency,
      condition,
      isNegotiable,
      canDeliver,
      stock,
      attributes,
      locationId,
    } = req.body;

    let businessId = null;

    if (user.accountType == "business") {
      const result = await pool.query(
        `SELECT business_id from businesses where user_id = $1`,
        [user.userId]
      );
      businessId = result.rows[0].business_id;
    }

    const insertQuery = `INSERT INTO listings (seller_id,business_id,category_id,subcategory_id,title,description,price,currency,condition,is_negotiable,can_deliver,stock,attributes,location_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`;
    const results = await pool.query(insertQuery, [
      user.userId,
      businessId,
      categoryId,
      subcategoryId,
      title,
      description,
      price,
      currency,
      condition,
      isNegotiable,
      canDeliver,
      stock,
      attributes ? JSON.stringify(attributes) : '{}',
      locationId,
    ]);

    res.json({messsage: "Product added successfully"})
  } catch (error) {
    console.log(error);
    return res.status(500).json({ messsage: "Internal server error" });
  }
};

const getListing = async (req,res) =>{
    const {categoryId, subcategoryId, lat, lon , radius =1000, maxPrice, minPrice,sortBy} = req.query
    try {
        let baseQuery = `SELECT l.*, a.location from listings l LEFT JOIN addresses a ON l.location_id = a.address_id where 1=1`;
        let params = [];
        let idx = 1;

        if (categoryId){
            baseQuery += ` AND l.category_id = $${idx++}`
            params.push(categoryId)
        }

        if(subcategoryId){
            baseQuery += ` AND l.subcategory_id = $${idx++}`
            params.push(subcategoryId)
        }

        if(lat && lon){
            baseQuery += ` AND ST_DWithin(
                a.location,
                ST_MakePoint($${idx++}, $${idx++})::geography,
                $${idx++}
            )`;
             params.push(lon, lat, radius);
        }

        if(minPrice){
            baseQuery += ` AND l.price >= $${idx++}`
            params.push(minPrice)
        }

        if(maxPrice){
            baseQuery += ` AND l.price <= $${idx++}`
            params.push(maxPrice)
        }

        if(sortBy == 'price_asc'){
            baseQuery += ` ORDER BY l.price ASC`
        }else if(sortBy == 'price_desc'){
            baseQuery += ` ORDER BY l.price DESC`
        }else{
            baseQuery += ` ORDER BY l.created_at DESC`
        }

        const results =  await pool.query(baseQuery,params)

        res.status(200).json({ listings: results.rows });
    } catch (error) {
        console.log(error)
        res.status(500).json({messsage: "Internal server error"})
    }
}

export { createListing, getListing };