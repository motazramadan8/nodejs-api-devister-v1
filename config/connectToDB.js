const mongoose = require("mongoose");

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CLOUD_URL);
    console.log("Connent To MongoDB ^_^");
  } catch (err) {
    console.log(`Connection To MongoDB Faild => ${err}`);
  }
};
