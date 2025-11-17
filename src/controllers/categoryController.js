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
  const { category_id } = req.params;

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
  const { subcategory_id } = req.params;

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
  const { category_id } = req.params;

  try {
    const category = await pool.query(`
        SELECT category_name, slug FROM categories WHERE category_id = $1
       `, [category_id])

    if (category.lenth == 0) {
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
  } catch (error) {
    console.log(error)
    res.status(500).json({
      error: "Failed to delete category!"
    })
  }
}

const getAllCategories = async (req, res) => {
  try {
    const categoriesResult = await pool.query(
      `SELECT category_id, category_name, slug FROM categories ORDER BY category_name ASC`
    );

    const subcategoriesResult = await pool.query(
      `SELECT subcategory_id, category_id, subcategory_name, slug FROM subcategories ORDER BY subcategory_name ASC`
    );

    const categories = categoriesResult.rows.map((category) => ({
      ...category,
      subcategories: subcategoriesResult.rows.filter(
        (sub) => sub.category_id === category.category_id
      ),
    }));

    res.status(200).json({ categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

const getSubcategoriesByCategorySlug = async (req, res) => {
  const { categorySlug } = req.params;
  try {
    const categoryResult = await pool.query(
      `SELECT category_id, category_name FROM categories WHERE slug = $1`,
      [categorySlug]
    );

    if (!categoryResult.rows.length) {
      return res.status(404).json({ message: "Category not found" });
    }

    const categoryId = categoryResult.rows[0].category_id;
    const subcategoriesResult = await pool.query(
      `SELECT subcategory_id, subcategory_name, slug FROM subcategories WHERE category_id = $1 ORDER BY subcategory_name ASC`,
      [categoryId]
    );

    res.status(200).json({
      category: categoryResult.rows[0],
      subcategories: subcategoriesResult.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
};

export {
  createCategory,
  createSubCategory,
  getCategory,
  getSubCategory,
  removeCategory,
  getAllCategories,
  getSubcategoriesByCategorySlug
}
