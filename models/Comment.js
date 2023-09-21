const mongoose = require("mongoose");
const joi = require("joi");

// Comment Schema
const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
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
  }
);

// Comment Model
const Comment = mongoose.model("Comment", CommentSchema);

// Validate Create Comment
function validateCreateComment(obj) {
  const schema = joi.object({
    postId: joi.string().required().label("Post ID"),
    text: joi.string().required().label("Text"),
  });
  return schema.validate(obj);
}

// Validate Update Comment
function validateUpdateComment(obj) {
  const schema = joi.object({
    text: joi.string().required(),
  });
  return schema.validate(obj);
}

module.exports = { Comment, validateCreateComment, validateUpdateComment };
