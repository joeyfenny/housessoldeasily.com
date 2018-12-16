var mongoose = require("mongoose");

var leadSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  streetAddress: String,
  city: String,
  state: String,
  zipCode: String,
  createdDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Lead", leadSchema);
