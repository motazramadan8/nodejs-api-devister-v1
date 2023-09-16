const asyncHandler = require("express-async-handler");
const { Category, validateCreateCategory } = require("../models/Category");

/** -----------------------------------
 * @desc   Create New Category
 * @route  /api/categories
 * @method POST
 * @access private (Only Admin)
-----------------------------------*/

module.exports.createCategoryCtrl = asyncHandler(async (req, res) => {
  // Validaion
  const { error } = validateCreateCategory(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Create Category In DB
  const category = await Category.create({
    title: req.body.title,
    user: req.user.id,
  });

  // Send Response To Client
  res.status(200).json({ category });
});

/** -----------------------------------
 * @desc   Get All Categories
 * @route  /api/categories
 * @method GET
 * @access public
-----------------------------------*/

module.exports.getAllCategoriesCtrl = asyncHandler(async (req, res) => {
  // Get All Categories From DB
  const categories = await Category.find();
  // Send Response To Client
  res.status(200).json(categories);
});

/** -----------------------------------
 * @desc   Delete Category
 * @route  /api/categories/:id
 * @method DELETE
 * @access private (Only Admins)
-----------------------------------*/

module.exports.deleteCategoryCtrl = asyncHandler(async (req, res) => {
  // Get Comment From DB
  const category = await Category.findById(req.params.id);

  // Validation
  if (!category) {
    return res.status(404).json({ msg: "Category Not Found" });
  }

  // Delete Category From DB
  await Category.findByIdAndDelete(req.params.id);

  // Send Response To Client
  res
    .status(200)
    .json({ msg: "Category Deleted Seccessfully", categoryId: category._id });
});
