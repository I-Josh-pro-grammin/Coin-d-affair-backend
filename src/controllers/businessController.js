import Stripe from "stripe";
import pool from "../config/database";

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

const getBusinessProductsPost = async (req, res) => {
  try {
    const user = req.user;
    const businessSearch = await pool.query(
      `SELECT business_id from businesses where user_id=$1`,
      [user.userId]
    );

    if (!businessSearch.rows.length) {
      return res.status(400).json({ message: "No such business" });
    }

    const businessId = businessSearch.rows[0].business_id;

    const allProducts = await pool.query(
      `SELECT * FROM listings where business_id=$1 ORDER BY created_at DESC`,
      [businessId]
    );

    if (!allProducts.rows.length) {
      return res.status(200).json({ message: "You have no product on market" });
    }

    res.status(200).json({ allProducts });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const addProductPost = async (req, res) => {
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

    if(user.accountType !== "business"){
        return res.status(403).json({message: "Only business are allowed to post products"})
    }

    const businessSearch = await pool.query(
        `SELECT business_id from businesses where user_id = $1`,
        [user.userId]
      );

    if (businessSearch.rowCount == 0) {
      return res.status(404).json({message: "Business not found"})
    }

    const businessId = businessSearch.rows[0].business_id

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
      attributes ? JSON.stringify(attributes) : "{}",
      locationId,
    ]);

    res.json({ messsage: "Product added successfully" });
  } catch (error) {
    return res.status(500).json({ messsage: "Internal server error" });
  }
};

const updateProductPost = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = req.user;
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
    } = req.body;

    const businessSearch = await pool.query(
      `SELECT business_id FROM businesses where user_id=$1`,
      [user.userId]
    );

    if (!businessSearch.rows.length) {
      return res
        .status(404)
        .json({ message: "Create a business account to update a product" });
    }

    const businessId = businessSearch.rows[0].business_id

    const productCheck = await pool.query(`SELECT listings_id from listings where listings_id=$1 AND business_id=$2`,[productId,businessId])

    if(productCheck.rowCount === 0){
        return res.status(403).json({message: "You are not the owner of the product"})
    }

    const orderCheck = await pool.query(
      `SELECT ord.status as orderStatus, oi.order_id as orderId from orders ord join order_items oi on ord.order_id = oi.order_id where oi.listing_id = $1`,
      [productId]
    );

    if(orderCheck.rowCount > 0){
        const checkOrderStatus = orderCheck.rows.some(
            (order) => order.orderStatus !== "delivered" && order.orderStatus !== "cancelled"
        )

        if(checkOrderStatus){
            return res.status(400).json({message: "Cannot update product. It has active or pending orders."})
        }
    }

    const updateQuery = await pool.query(
      `UPDATE listings SET category_id=$1,subcategory_id=$2,title=$3,description=$4,price=$5,currency=$6,condition=$7,is_negotiable=$8,can_deliver=$9,stock=$10,attributes=$11 where listing_id=$12`,
      [
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
        productId,
      ]
    );

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProductPost = async (req, res) => {
  try {
    const user = req.user;
    const productId = req.params.productId;

    const businessSearch = await pool.query(
      `SELECT business_id from businesses where user_id = $1`,
      [user.userId]
    );
    if (!businessSearch.rows.length) {
      return res.status(404).json({ message: "Create a business account " });
    }

    const businessId = businessSearch.rows[0].business_id
    const productSearch = await pool.query(
      `SELECT listing_id from listings where listing_id=$1 AND business_id = $2`,
      [productId,businessId]
    );

    if (productSearch.rowCount === 0) {
      return res.status(404).json({ message: "Product does not belong to you" });
    }

    const checkProduct = await pool.query(
      `SELECT ord.status as orderStatus, oi.order_id as orderId from orders ord join order_items oi on  oi.order_id = or.order_id where oi.listing_id = $1 `,
      [productId]
    );

    if (checkProduct.rowCount == 0) {
      return res.status(200).json({ message: "Product deleted successfully" });
    }

    const hasActiveOrders = checkProduct.rows.some(
      (order) =>
        order.orderStatus !== "delivered" && order.orderStatus !== "cancelled"
    );

    if (hasActiveOrders) {
      return res
        .status(400)
        .json({ message: "Cannot delete product. It is in orders" });
    }

    await pool.query(`DELETE FROM listings where listing_id=$1`, [productId]);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getBusinessTransactions = async(req,res)=>{
  try {
    
  } catch (error) {
    
  }
}

export {
  getBusinessProfile,
  getBusinessProductsPost,
  addProductPost,
  updateProductPost,
  deleteProductPost
}