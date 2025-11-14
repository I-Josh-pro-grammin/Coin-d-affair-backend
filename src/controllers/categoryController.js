import pool from '../config/database.js'

const createCategory = async (req, res) => {
  const {
    category_name, 
    slug
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO categories(category_name, slug) VALUES ($1, $2)  
   `, [category_name, slug]);

    res.status(201).json({
      message: "Category is created successfully"
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      error: "Failed to create category"
    })
  }

}

const createSubCategory = async (req, res) => {
  const {
    category_id,
    subcategory_name, 
    slug
  } = req.body;

  try {
    const subCategory = await pool.query(`
      INSERT INTO subcategories(category_id, subcategory_name, slug) VALUES ($1, $2, $3) 
    `, [category_id, subcategory_name, slug])

    res.status(201).json({
      message: "Sub-Category created successfully"
    })
  } catch (error) {
    res.status(500).json("sub-category creation failed!")
  }
}

const getCategory = async (req, res) => {
  const {category_id} = req.params;

  try {
    const category = await pool.query(`
      SELECT category_name, slug FROM categories WHERE category_id = $1
     `, [category_id])

  res.status(200).json({
    message: category
  })
  } catch (error) {
    console.log(error)
    res.status(404).json({
      error: "Category not found"
    })
  }
}

const getSubCategory = async (req, res) => {
  const {subcategory_id} = req.params;

  try {
    const subcategory = await pool.query(`
        SELECT subcategory_name, slug FROM subcategories WHERE subcategory_id = $1
       `, [subcategory_id])

    res.status(200).json({
      message: subcategory
    })
  } catch (error) {
    res.status(404).json({
      error: "Sub category not found"
    })
  }
} 

const removeCategory = async (req, res) => {
  const {category_id} = req.params;

  try {
    const category = await pool.query(`
        SELECT category_name, slug FROM categories WHERE category_id = $1
       `, [category_id])

       if(category.lenth == 0) {
         res.status(404).json({
          error: "Category does not exist"
         })
       }

       await pool.query(`
        DELETE FROM categories WHERE category_id = $1
       `, [category_id])

    res.status(200).json({
      message: "Category removed successfully"
    })
  }catch (error) {
    console.log(error)
    res.status(500).json({
      error: "Failed to delete category!"
    })
  }
}

export {
  createCategory,
  createSubCategory,
  getCategory,
  getSubCategory,
  removeCategory
}
