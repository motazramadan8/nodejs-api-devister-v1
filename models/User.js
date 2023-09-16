const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const passwordComplexity = require("joi-password-complexity");

// User Schema
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },
    profilePhoto: {
      type: Object,
      default: {
        url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
        publicId: null,
      },
    },
    bio: {
      type: String,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pupulate Posts That Belong To This User When He/She Get His/Her Profile
UserSchema.virtual("posts", {
  ref: "Post",
  foreignField: "user",
  localField: "_id",
});

// Generate Auth Token
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SECRET_KEY
  );
};

// User Model
const User = mongoose.model("User", UserSchema);

// Validate Register User
function validateRegisterUser(obj) {
  const schema = Joi.object({
    username: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().min(5).max(100).required().email(),
    password: passwordComplexity().required(),
  });
  return schema.validate(obj);
}

// Validate Login User
function validateLoginUser(obj) {
  const schema = Joi.object({
    email: Joi.string().trim().min(5).max(100).required().email(),
    password: Joi.string().trim().min(8).required(),
  });
  return schema.validate(obj);
}

// Validate Update User
function validateUpdateUser(obj) {
  const schema = Joi.object({
    username: Joi.string().trim().min(2).max(100).required(),
    password: passwordComplexity(),
    oldPassword: Joi.string().trim().min(8),
    bio: Joi.string(),
  });
  return schema.validate(obj);
}

// Validate Email
function validateEmail(obj) {
  const schema = Joi.object({
    email: Joi.string().trim().min(5).max(100).required().email(),
  });
  return schema.validate(obj);
}

// Validate New Password
function validateNewPassword(obj) {
  const schema = Joi.object({
    password: passwordComplexity().required(),
  });
  return schema.validate(obj);
}

module.exports = {
  User,
  validateRegisterUser,
  validateLoginUser,
  validateUpdateUser,
  validateEmail,
  validateNewPassword,
};
