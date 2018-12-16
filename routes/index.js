var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

//root route
router.get("/", function(req, res) {
  res.render("index");
});

// show signup form
router.get("/signup", function(req, res) {
  res.render("signup", {page: 'signup'});
});

//handle sign up logic
router.post("/signup", function(req, res) {
  var newUser = new User({username: req.body.username});
  if (req.body.adminCode === process.env.ADMIN_CODE) {
    newUser.isAdmin = true;
  }
  User.signup(newUser, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      return res.render("signup", {error: err.message});
    }
    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Successfully signed Up! Nice to meet you " + req.body.username);
      res.redirect("/campgrounds");
    });
  });
});

//show login form
router.get("/login", function(req, res) {
  res.render("login", {page: 'login'});
});

//handling login logic
router.post("/login", passport.authenticate("local", {
  successRedirect: "/campgrounds",
  failureRedirect: "/login",
  failureFlash: true,
  successFlash: 'Welcome to YelpCamp!'
}), function(req, res) {});

// logout route
router.get("/logout", function(req, res) {
  req.logout();
  req.flash("success", "Successfully logged out.");
  res.redirect("/campgrounds");
});

module.exports = router;
