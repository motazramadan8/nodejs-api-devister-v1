const router = require("express").Router();
const {
  verifyToken,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");
const validateObjecId = require("../middlewares/validateObjectId");
const {
  createCommentCtrl,
  getAllCommentsCtrl,
  deleteCommentCtrl,
  updateCommentCtrl,
} = require("../controllers/commentController");

// /api/comments
router
  .route("/")
  .post(verifyToken, createCommentCtrl)
  .get(getAllCommentsCtrl);

// /api/comments/:id
router.route("/:id")
  .delete(validateObjecId, verifyToken, deleteCommentCtrl)
  .put(validateObjecId, verifyToken, updateCommentCtrl)

module.exports = router;
