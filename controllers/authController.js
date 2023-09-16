// Start Packeges
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
// End Packeges
// Start Main Varibles
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const sendEmail = require("../utils/sendEmail");
// End Main Varibles

/** ----------------------------------- 
 * @desc   Register New User
 * @route  /api/auth/register
 * @method POST
 * @access public
-----------------------------------*/
module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Is User Already Exists
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ msg: "User Already Exists" });
  }

  // Hash The Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // New User & Save It In DataBase
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  await user.save();

  // Creating New VerifcationToken & Save It To DB
  const verifcationToken = new VerificationToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
  });
  await verifcationToken.save();

  // Making The Link
  const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verifcationToken.token}`;

  // Putting Link Into HTML Template
  const htmlTemplate = `
    <div>
      <p>Click On The Link Below To Verify Your Email</p>
      <a href="${link}">Verify</a>
    </div>
  `;

  // Sending Email To User
  await sendEmail(user.email, "Verify Devister Email", htmlTemplate);

  // Send Response To Client
  res.status(201).json({
    msg: "We Sent Email To You, Please Verify Your Email Address",
    user: user.username,
  });
});

/** ----------------------------------- 
 * @desc   Log in User
 * @route  /api/auth/login
 * @method POST
 * @access public
-----------------------------------*/
module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Is User Exists
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ msg: "Invalid Email Or Password" });
  }

  // Check The Password
  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ msg: "Invalid Email Or Password" });
  }

  // Sending email (verify account if not verified)
  if (!user.isAccountVerified) {
    let verifcationToken = await VerificationToken.findOne({
      userId: user._id,
    });
    if (!verifcationToken) {
      verifcationToken = new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      });
      await verifcationToken.save();
    }

    // Making The Link
    const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verifcationToken.token}`;

    // Putting Link Into HTML Template
    const htmlTemplate = `
      <div>
        <p>Click On The Link Below To Verify Your Email</p>
        <a href="${link}">Verify</a>
      </div>
    `;

    // Sending Email To User
    await sendEmail(user.email, "Verify Devister Email", htmlTemplate);

    return res.status(400).json({
      msg: "We Sent Email To You, Please Verify Your Email Address",
      user: user.username,
    });
  }

  // Generate Token (JWT)
  const token = user.generateAuthToken();

  // Send Response To Client
  res.status(200).json({
    _id: user._id,
    username: user.username,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    following: user.following,
    followers: user.followers,
    token,
  });
});

/** ----------------------------------- 
 * @desc   Verify User Email
 * @route  /api/auth/:userId/verify/:token
 * @method GET
 * @access public
-----------------------------------*/
module.exports.verifyUserEmailCtrl = asyncHandler(async (req, res) => {
  // Search User By Id From Params
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ msg: "Invalid Link" });
  }

  // Check Token
  const verifcationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verifcationToken) {
    return res.status(400).json({ msg: "Invalid Link" });
  }

  // If Everything True
  user.isAccountVerified = true;
  await user.save();

  // Delete Verification Token
  await VerificationToken.deleteOne({ userId: user._id });

  // Send Response To Client
  res.status(200).json({ msg: "Your Account Verified" });
});
