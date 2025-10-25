const pool = require("../config/database");
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

export { getListing };