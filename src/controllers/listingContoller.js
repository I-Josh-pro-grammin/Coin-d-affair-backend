import pool from "../config/database.js";

const baseListingSelect = `
    SELECT 
        l.*,
        a.location,
        c.category_name,
        c.slug as category_slug,
        sc.subcategory_name,
        sc.slug as subcategory_slug,
        b.business_name
    FROM listings l 
    LEFT JOIN addresses a ON l.location_id = a.address_id 
    LEFT JOIN categories c ON l.category_id = c.category_id
    LEFT JOIN subcategories sc ON l.subcategory_id = sc.subcategory_id
    LEFT JOIN businesses b ON l.business_id = b.business_id
    WHERE 1=1
`;

const getListing = async (req, res) => {
    const {
        categoryId,
        subcategoryId,
        lat,
        lon,
        radius = 1000,
        maxPrice,
        minPrice,
        sortBy,
        search,
        listingId,
        limit = 30,
        page = 1
    } = req.query
    try {
        let baseQuery = baseListingSelect;
        let params = [];
        let idx = 1;

        if (categoryId) {
            baseQuery += ` AND l.category_id = $${idx++}`
            params.push(categoryId)
        }

        if (subcategoryId) {
            baseQuery += ` AND l.subcategory_id = $${idx++}`
            params.push(subcategoryId)
        }

        if (listingId) {
            baseQuery += ` AND l.listings_id = $${idx++}`
            params.push(listingId)
        }

        if (search) {
            baseQuery += ` AND (LOWER(l.title) LIKE $${idx} OR LOWER(l.description) LIKE $${idx + 1})`
            const likeSearch = `%${search.toLowerCase()}%`
            params.push(likeSearch, likeSearch)
            idx += 2;
        }

        if (lat && lon) {
            baseQuery += ` AND ST_DWithin(
                a.location,
                ST_MakePoint($${idx++}, $${idx++})::geography,
                $${idx++}
            )`;
            params.push(lon, lat, radius);
        }

        if (minPrice) {
            baseQuery += ` AND l.price >= $${idx++}`
            params.push(minPrice)
        }

        if (maxPrice) {
            baseQuery += ` AND l.price <= $${idx++}`
            params.push(maxPrice)
        }

        if (sortBy == 'price_asc') {
            baseQuery += ` ORDER BY l.price ASC`
        } else if (sortBy == 'price_desc') {
            baseQuery += ` ORDER BY l.price DESC`
        } else {
            baseQuery += ` ORDER BY l.created_at DESC`
        }

        const normalizedLimit = Math.min(Number(limit) || 30, 60)
        const currentPage = Number(page) || 1
        const offset = (currentPage - 1) * normalizedLimit

        baseQuery += ` LIMIT $${idx++} OFFSET $${idx++}`
        params.push(normalizedLimit, offset)

        const results = await pool.query(baseQuery, params)

        res.status(200).json({ listings: results.rows, pagination: { page: currentPage, limit: normalizedLimit, count: results.rowCount } });
    } catch (error) {
        console.log(error)
        res.status(500).json({ messsage: "Internal server error" })
    }
}

const getListingById = async (req, res) => {
    try {
        const { listingId } = req.params;
        const query = `${baseListingSelect} AND l.listings_id = $1 LIMIT 1`;
        const result = await pool.query(query, [listingId]);

        if (!result.rows.length) {
            return res.status(404).json({ message: "Listing not found" });
        }

        res.status(200).json({ listing: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

const getAllListings =  async(req,res)=>{
    try{
        const {limit =30, page =1} = req.query;
        const normalizedLimit = Math.min(Number(limit) || 30,100)
        const currentPage = Number(page) || 1
        const offset = (currentPage -1 ) * normalizedLimit

        let query = `${baseListingSelect} ORDER BY l.created_at DESC LIMIT $1 OFFSET $2`;
        const result = await pool.query(query,[normalizedLimit,offset])

        res.status(200).json({
            products: result.rows,
            pagination:{
                page: currentPage,
                limit: normalizedLimit,
                count: result.rowCount
            }
        })
    }catch(error){
        return res.status(500).json({message: "Internal server error"})
    }
}

export { getListing, getListingById,getAllListings };
