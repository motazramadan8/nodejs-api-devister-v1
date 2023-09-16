const asyncHandler = require("express-async-handler");
const {
  Comment,
  validateCreateComment,
  validateUpdateComment,
} = require("../models/Comment");
const { User } = require("../models/User");

/** -----------------------------------
 * @desc   Create New Comment
 * @route  /api/comments
 * @method POST
 * @access private (Only Logged In User)
-----------------------------------*/

module.exports.createCommentCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateCreateComment(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Get User Profile That Want To Add Comment
  const profile = await User.findById(req.user.id);

  // Create Comment And Save It In DB
  const comment = await Comment.create({
    postId: req.body.postId,
    text: req.body.text,
    user: req.user.id,
    username: profile.username,
  });

  // Send Response To Client
  res.status(201).json(comment);
});

/** ---------------------------------
 * @desc   Get All Comment
 * @route  /api/comments
 * @method GET
 * @access private (Only Admins)
-----------------------------------*/

module.exports.getAllCommentsCtrl = asyncHandler(async (req, res) => {
  // Get All Comments From DB
  let comments = await Comment.find()
  .sort({ createdAt: -1 })
  .populate("user", ["-password"]);

  // Send Response To Client
  res.status(200).json(comments);
});

/** -----------------------------------
 * @desc   Delete Comment
 * @route  /api/comments/:id
 * @method DELETE
 * @access private (Only Admins Or Owner Of The Post)
-----------------------------------*/

module.exports.deleteCommentCtrl = asyncHandler(async (req, res) => {
  // Get Comment From DB
  const comment = await Comment.findById(req.params.id);

  // Validation
  if (!comment) {
    return res.status(404).json({ msg: "Comment Not Found" });
  }

  // Auth
  if (req.user.isAdmin || req.user.id === comment.user.toString()) {
    // Delete Comment From DB
    await Comment.findByIdAndDelete(req.params.id);
    // Send Response To Client
    res.status(200).json({ msg: "Comment Deleted Seccessfully" });
  } else {
    return res
      .status(403)
      .json({ msg: "Not Allow, Only Owner User Or Admins" });
  }
});

/** -----------------------------------
 * @desc   Update Comment
 * @route  /api/comments/:id
 * @method PUT
 * @access private (Only Owner Of The Comment)
-----------------------------------*/

module.exports.updateCommentCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateUpdateComment(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Get Comment From DB If It Exist
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ msg: "Comment Not Found" });
  }

  // Check If User That Want To Update Post Is Owner Of Post And If User Logged In
  if (req.user.id !== comment.user.toString()) {
    return res.status(403).json({ msg: "Not Allow, Only Owner User" });
  }

  // Update Post Data In DB
  const profile = await User.findById(req.user.id);
  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        text: req.body.text,
      },
    },
    { new: true }
  );

  // Send Response To Client
  res
    .status(200)
    .json({ msg: "Comment Updated Successfully", comment: updatedComment });
});
