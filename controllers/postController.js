const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const {
  Post,
  validationCreatePost,
  validationUpdatePost,
} = require("../models/Post");
const { User } = "../models/User";
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");
const { Comment } = require("../models/Comment");

/** -----------------------------------
 * @desc   Create New Post
 * @route  /api/posts
 * @method POST
 * @access private (Only Logged In User)
-----------------------------------*/

module.exports.createPostCrtl = asyncHandler(async (req, res) => {
  // Validation For Image
  if (!req.file) {
    return res.status(400).json({ msg: "No Image Provided" });
  }

  // Validation For Data
  const { error } = validationCreatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Upload Photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);
  
  // Create New Post And Save It In DB
  const post = await Post.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category.split(","),
    user: req.user.id,
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });

  // Send Response To Client
  res.status(201).json(post);

  // Delete Image From Server
  await fs.unlinkSync(imagePath);
});

/** -----------------------------------
 * @desc   Update Post
 * @route  /api/posts/:id
 * @method PUT
 * @access private (Only Owner Of Post)
-----------------------------------*/

module.exports.updatePostCtrl = asyncHandler(async (req, res) => {
  // Validatoin
  const { error } = validationUpdatePost(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // Get Post From DB If It Exist
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ msg: "Post Not Found" });
  }

  // Check If User That Want To Update Post Is Owner Of Post And If User Logged In
  if (req.user.id !== post.user.toString()) {
    return res.status(403).json({ msg: "Not Allow, Only Owner User" });
  }

  // Update Post Data In DB
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
      },
    },
    { new: true }
  ).populate("user", ["-password"]);

  // Send Response To Client
  res.status(200).json({ msg: "Post Updated Successfully", post: updatedPost });
});

/** -----------------------------------
 * @desc   Get All Posts
 * @route  /api/posts
 * @method GET
 * @access public
-----------------------------------*/

module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
  const POST_PER_PAGE = 10;
  const { pageNumber, category } = req.query;
  let posts;

  if (pageNumber) {
    posts = await Post.find()
      .skip((pageNumber - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  }
  // Send Response To Client
  res.status(200).json(posts);
});

/** -----------------------------------
 * @desc   Get Single Post
 * @route  /api/posts/:id
 * @method GET
 * @access public
-----------------------------------*/

module.exports.getSinglePostsCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", ["-password"])
    .populate("comments");
  if (!post) {
    return res.status(404).json({ msg: "Post Not Found" });
  }

  res.status(200).json(post);
});
/** -----------------------------------
 * @desc   Get Posts Count
 * @route  /api/posts/count
 * @method GET
 * @access public
-----------------------------------*/

module.exports.getPostsCountCtrl = asyncHandler(async (req, res) => {
  const count = await Post.count();
  res.status(200).json(count);
});

/** -----------------------------------
 * @desc   Delete Post
 * @route  /api/posts/:id
 * @method DELETE
 * @access private (Only Admins Or Owner Of Post)
-----------------------------------*/

module.exports.deletePostCtrl = asyncHandler(async (req, res) => {
  // Get Post From DB
  const post = await Post.findById(req.params.id);

  // Validation
  if (!post) {
    res.status(404).json({ msg: "Post Not Found" });
  }

  // Auth
  if (req.user.isAdmin || req.user.id === post.user.toString()) {
    // Delete Post From DB
    await Post.findByIdAndDelete(req.params.id);

    // Delete Post Image From Cloudinary
    await cloudinaryRemoveImage(post.image.publicId);

    // Delete Comments That Belong To This Post
    await Comment.deleteMany({ postId: post._id });

    // Send Response To Client
    res
      .status(200)
      .json({ msg: "Post Deleted Seccessfully", postId: post._id });
  } else {
    return res
      .status(403)
      .json({ msg: "Not Allow, Only Owner User Or Admins" });
  }
});

/** -----------------------------------
 * @desc   Update Post Image
 * @route  /api/posts/upload-image/:id
 * @method PUT
 * @access private (Only Owner Of Post)
-----------------------------------*/

module.exports.updatePostImageCtrl = asyncHandler(async (req, res) => {
  // Validatoin
  if (!req.file) {
    return res.status(400).json({ msg: "No Image Provided" });
  }

  // Get Post From DB If It Exist
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ msg: "Post Not Found" });
  }

  // Check If User That Want To Update Post Is Owner Of Post And If User Logged In
  if (req.user.id !== post.user.toString()) {
    return res.status(403).json({ msg: "Not Allow, Only Owner User" });
  }

  // Update Post Image
  // 1. Delete Old Image From Cloudinary
  await cloudinaryRemoveImage(post.image.publicId);
  // 2. Upload New Image To Cloudinary
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);
  // 3. Update Image Feild In DB
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );

  // Send Response To Client
  res.status(200).json(updatedPost);

  // Delete Image from Server
  fs.unlinkSync(imagePath);
});

/** -----------------------------------
 * @desc   Toggle Like
 * @route  /api/posts/like/:id
 * @method PUT
 * @access private (Only Loggen In)
-----------------------------------*/

module.exports.toggleLikeCtrl = asyncHandler(async (req, res) => {
  const loggedInUser = req.user.id;
  const { id: postId } = req.params;

  // Get Post From DB
  let post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ msg: "Post Not Found" });
  }

  // Toggle Like
  const isPostAlreadyLiked = post.likes.find(
    (user) => user.toString() === loggedInUser
  );

  if (isPostAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loggedInUser },
      },
      { new: true }
    );
  } else {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loggedInUser },
      },
      { new: true }
    );
  }

  // Send Response To Client
  res.status(200).json(post);
});
