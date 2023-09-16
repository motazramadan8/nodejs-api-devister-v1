// Start Packeges
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
// End Packeges

// Start Main Varibles
const { User, validateUpdateUser } = require("../models/User");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
  cloudinaryRemoveManyImages,
} = require("../utils/cloudinary");
const { Comment } = require("../models/Comment");
const { Post } = require("../models/Post");
// End Main Varibles

/** -----------------------------------
 * @desc   Get All Users Profile
 * @route  /api/users/profile
 * @method GET
 * @access private (Only Admins)
-----------------------------------*/

module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").populate("posts");
  res.status(200).json(users);
});

/** -----------------------------------
 * @desc   Get User Profile
 * @route  /api/users/profile/:id
 * @method GET
 * @access public
-----------------------------------*/

module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("posts");
  if (!user) {
    return res.status(404).json({ msg: "User Not Found" });
  }
  res.status(200).json(user);
});

/** -----------------------------------
 * @desc   Update User Profile
 * @route  /api/users/profile/:id
 * @method PUT
 * @access private (Only User Himself)
-----------------------------------*/

module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  // Validation
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  const { oldPassword } = req.body;
  // Check The Password
  if (oldPassword) {
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ msg: "Old Password Is Invalid" });
    }
  }

  // Hash The New Password
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  // Update User
  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  )
    .select("-password")
    .populate("posts");
  res.status(200).json(updateUser);
});

/** -----------------------------------
 * @desc   Get Users Count
 * @route  /api/users/count
 * @method GET
 * @access private (Only Admins)
-----------------------------------*/

module.exports.getUsersCountCtrl = asyncHandler(async (req, res) => {
  const count = await User.count();
  res.status(200).json(count);
});

/** -----------------------------------
 * @desc   Profile Photo Upload
 * @route  /api/users/profile-photo-upload
 * @method POST
 * @access private (Only Logged In Users)
-----------------------------------*/

module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
  // Validation
  if (!req.file) {
    return res.status(400).json({ msg: "No File Provided" });
  }

  // Get The Path To The Image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

  // Upload To Cloudinary
  const result = await cloudinaryUploadImage(imagePath);

  // Get The User From DB
  const user = await User.findById(req.user.id);

  // Delete The Old Profile Photo If Exist
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }

  // Change The profilePhoto Field In The DB
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save();

  // Send Response To Client
  res.status(200).json({
    msg: "Your Profile Photo Uploaded Seccessfully",
    profilePhoto: { url: result.secure_url, publicId: result.public_id },
  });

  // Remove Image From The Server
  fs.unlinkSync(imagePath);
});

/** -----------------------------------
 * @desc   Delete User Profile (Account)
 * @route  /api/users/profile/:id
 * @method DELETE
 * @access private (Only User Himself Or Admins)
-----------------------------------*/

module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  // Get User From DataBase
  const user = await User.findById(req.params.id);
  // Validation
  if (!user) {
    return res.status(404).json({ msg: "User Not Found" });
  }

  // Get All Posts From DataBase
  const posts = await Post.find({ user: user._id });

  // Get The publicId From The Posts
  const publicIds = posts?.map((post) => post.image.publicId);

  // Delete All Posts Images From Cloudinary That Belong To This User
  if (publicIds?.length > 0) {
    await cloudinaryRemoveManyImages(publicIds);
  }

  // Delete profilePhoto From Cloudinary
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }

  // Delete User Posts And Comments
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });

  // Delete The User Himself
  await User.findByIdAndDelete(req.params.id);

  // Send Response To The Client
  res.status(200).json({ msg: "Profile Deleted Sucessfully" });
});

/** -----------------------------------
 * @desc   Get Two Random Users
 * @route  /api/users/random-users
 * @method GET
 * @access private (Only Logged In User)
-----------------------------------*/

module.exports.getTwoRandomUsers = asyncHandler(async (req, res) => {
  const usersCount = await User.count();
  const users = await User.aggregate([
    {
      $sample: {
        size: usersCount,
      },
    },
  ]);
  if (!users) {
    return res.status(404).json({ msg: "Not Found Users" });
  }
  res.status(200).json(users);
});

/** -----------------------------------
 * @desc   Toggle Follow
 * @route  /api/users/follow/:id
 * @method PUT
 * @access private (Only Loggen In)
-----------------------------------*/

module.exports.toggleFollowCtrl = asyncHandler(async (req, res) => {
  const loggedInUser = req.user.id;
  const { id: userId } = req.params;

  // Get User From DB
  let user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ msg: "User Not Found!" });
  }

  // Toggle Like
  const isProfileAlreadyFollowed = user.followers.find(
    (user) => user.toString() === loggedInUser
  );

  if (isProfileAlreadyFollowed) {
    user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { followers: loggedInUser },
      },
      { new: true }
    );
  } else {
    user = await User.findByIdAndUpdate(
      userId,
      {
        $push: { followers: loggedInUser },
      },
      { new: true }
    );
  }

  // Send Response To Client
  res.status(200).json(user);
});
