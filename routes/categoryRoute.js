const router = require("express").Router();
const {
  verifyToken,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");
const validateObjecId = require("../middlewares/validateObjectId");
const {
  createCategoryCtrl,
  getAllCategoriesCtrl,
  deleteCategoryCtrl,
} = require("../controllers/categoriesController");

// /api/categories
router
  .route("/")
  .post(verifyTokenAndAdmin, createCategoryCtrl)
  .get(getAllCategoriesCtrl);

// /api/categories/:id
router
  .route("/:id")
  .delete(validateObjecId, verifyTokenAndAdmin, deleteCategoryCtrl);

module.exports = router;
