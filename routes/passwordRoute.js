const router = require("express").Router();
const {
  sendResetPasswordLinkCtrl,
  getResetPasswordLink,
  resetPasswordCtrl,
} = require("../controllers/passwordController");

// /api/password/reset-password-link
router.post("/reset-password-link", sendResetPasswordLinkCtrl);

// /api/password/reset-password/:userId/:token
router
  .route("/reset-password/:userId/:token")
  .get(getResetPasswordLink)
  .post(resetPasswordCtrl);

module.exports = router;
