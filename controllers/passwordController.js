// Start Packeges
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
// End Packeges
// Start Main Varibles
const { User, validateEmail, validateNewPassword } = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const sendEmail = require("../utils/sendEmail");
// End Main Varibles

/** ----------------------------------- 
 * @desc   Send Reset Password Link
 * @route  /api/password/reset-password-link
 * @method POST
 * @access public
-----------------------------------*/
module.exports.sendResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateEmail(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Get User From DB By Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res
      .status(404)
      .json({ msg: "User With Given Email Does Not Exist!" });
  }

  // Creating VerifcationToken
  let verifcationToken = await VerificationToken.findOne({ userId: user._id });
  if (!verifcationToken) {
    verifcationToken = new VerificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await verifcationToken.save();
  }

  // Creating Link
  const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verifcationToken.token}`;

  // Creating HTML Template
  const htmlTemplate = `
    <div>
        <p>Click On The Link Below To Reset Your Password</p>
        <a href="${link}">Reset Password</a>
    </div>
  `;

  // Sending Email
  await sendEmail(user.email, "Reset Password", htmlTemplate);

  // Send Response To Client
  res.status(200).json({
    msg: "Password Reset Link Sent To Your Email, Please Check Your Inbox",
  });
});

/** ----------------------------------- 
 * @desc   Get Reset Password Link
 * @route  /api/password/reset-password/:userId/:token
 * @method GET
 * @access public
-----------------------------------*/
module.exports.getResetPasswordLink = asyncHandler(async (req, res) => {
  // Get User From DB
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ msg: "Invalid id!" });
  }

  // Verifcation Token
  const verifcationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verifcationToken) {
    return res.status(404).json({ msg: "Invalid id!" });
  }

  // Send Response To Client
  res.status(200).json({ msg: "Valid URL" });
});

/** ----------------------------------- 
 * @desc   Reset Password
 * @route  /api/password/reset-password/:userId/:token
 * @method POST
 * @access public
-----------------------------------*/
module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateNewPassword(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Get User From DB
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ msg: "Invalid Link" });
  }

  const verifcationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verifcationToken) {
    return res.status(404).json({ msg: "Invalid Link" });
  }

  // Verify Account
  if (!user.isAccountVerified) {
    user.isAccountVerified = true;
  }

  // Hash The Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Reset Password
  user.password = hashedPassword;
  await user.save();

  // Delete Verification Token
  await VerificationToken.deleteOne({ userId: user._id });

  // Send Response To Client
  res.status(200).json({ msg: "Password Reset Successfully, Please Login" });
});
