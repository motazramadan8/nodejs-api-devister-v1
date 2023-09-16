const express = require("express")
const multer = require("multer");
const path = require("path");

// Photo Storage
const photoStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../images"));
  },
  filename: function (req, file, callback) {
    if (file) {
      callback(
        null,
        new Date().toISOString().replace(/:/g, "-") + file.originalname
      );
    } else {
      callback(null, false);
    }
  },
});

// Photo Upload Middleware
const photoUpload = multer({
  storage: photoStorage,
  fileFilter: function (req, file, callback) {
    if (file.mimetype.startsWith("image")) {
      callback(null, true);
    } else {
      callback({ message: "Unsupported File Format" }, false);
    }
  },
  limits: {
    fileSize: 1024 * 1024, // 1 megabyte
  },
});

module.exports = photoUpload;
