const mongoose = require("mongoose");
const Joi = require("joi");

// Post Schema
const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: [
      {
        type: String,
        required: true,
        ref: "Category",
      },
    ],
    image: {
      type: Object,
      default: {
        url: "",
        publicId: null,
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pupulate Comments That Belong To This Post
PostSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "postId",
  localField: "_id",
});

// Post Model
const Post = mongoose.model("Post", PostSchema);

// Validation Create Post
function validationCreatePost(obj) {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().min(10).required(),
    category: Joi.string().trim().required(),
  });
  return schema.validate(obj);
}

// Validation Update Post
function validationUpdatePost(obj) {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(200),
    description: Joi.string().trim().min(10),
    category: Joi.array(),
  });
  return schema.validate(obj);
}

module.exports = { Post, validationCreatePost, validationUpdatePost };
