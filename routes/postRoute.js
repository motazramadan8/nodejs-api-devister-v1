const router = require("express").Router();
const photoUpload = require("../middlewares/photoUpload");
const { verifyToken } = require("../middlewares/verifyToken");
const {
  createPostCrtl,
  getAllPostsCtrl,
  getSinglePostsCtrl,
  getPostsCountCtrl,
  deletePostCtrl,
  updatePostCtrl,
  updatePostImageCtrl,
  toggleLikeCtrl,
} = require("../controllers/postController");
const validateObjecId = require("../middlewares/validateObjectId");

// /api/posts
router
  .route("/")
  .post(verifyToken, photoUpload.single("image"), createPostCrtl)
  .get(getAllPostsCtrl);

// /api/posts/count
router.route("/count").get(getPostsCountCtrl);

// /api/posts/:id
router
  .route("/:id")
  .get(validateObjecId, getSinglePostsCtrl)
  .delete(validateObjecId, verifyToken, deletePostCtrl)
  .put(validateObjecId, verifyToken, updatePostCtrl);

// /api/posts/upload-image/:id
router
  .route("/upload-image/:id")
  .put(
    validateObjecId,
    verifyToken,
    photoUpload.single("image"),
    updatePostImageCtrl
  );

// /api/posts/like/:id
router.route("/like/:id").put(validateObjecId, verifyToken, toggleLikeCtrl);

module.exports = router;
