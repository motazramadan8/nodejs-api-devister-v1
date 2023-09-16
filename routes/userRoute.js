// Start Main Varibles
const router = require("express").Router();
const {
  getAllUsersCtrl,
  getUserProfileCtrl,
  updateUserProfileCtrl,
  getUsersCountCtrl,
  profilePhotoUploadCtrl,
  deleteUserProfileCtrl,
  getTwoRandomUsers,
  toggleFollowCtrl,
} = require("../controllers/userContoller");
const {
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyToken,
  verifyTokenAndOnlyUserOrAdmins,
} = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");
const photoUpload = require("../middlewares/photoUpload");
// Start Main Varibles

// /api/users/profile
router.route("/profile").get(verifyTokenAndAdmin, getAllUsersCtrl);

// /api/users/profile/:id
router
  .route("/profile/:id")
  .get(validateObjectId, getUserProfileCtrl)
  .put(validateObjectId, verifyTokenAndOnlyUser, updateUserProfileCtrl)
  .delete(
    validateObjectId,
    verifyTokenAndOnlyUserOrAdmins,
    deleteUserProfileCtrl
  );

// /api/users/random-users
router.route("/random-users").get(getTwoRandomUsers);

// /api/users/profile-photo-upload
router
  .route("/profile/profile-photo-upload")
  .post(verifyToken, photoUpload.single("image"), profilePhotoUploadCtrl);

// /api/users/count
router.route("/count").get(verifyTokenAndAdmin, getUsersCountCtrl);

// /api/users/follow/:id
router.route("/follow/:id").put(validateObjectId, verifyToken, toggleFollowCtrl);

module.exports = router;
