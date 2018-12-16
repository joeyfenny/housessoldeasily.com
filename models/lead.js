var mongoose = require("mongoose");

var leadSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phoneNumber: String,
  email: String,
  streetAddress: String,
  state: String,
  zipCode: Number,
  createdDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Lead", leadSchema);
