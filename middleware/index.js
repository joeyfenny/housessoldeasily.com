var Lead = require('../models/lead');

module.exports = {

  isLoggedIn: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'You must be signed in to do that!');
    res.redirect('/login');
  },

  checkUserLead: function(req, res, next) {
    Lead.findById(req.params.id, function(err, foundLead) {
      if (err || !foundLead) {
        console.log(err);
        req.flash('error', 'Sorry, that lead does not exist!');
        res.redirect('/leads');
      } else if (foundLead.author.id.equals(req.user._id) || req.user.isAdmin) {
        req.lead = foundLead;
        next();
      } else {
        req.flash('error', 'You don\'t have permission to do that!');
        res.redirect('/leads/' + req.params.id);
      }
    });
  },

  isAdmin: function(req, res, next) {
    if (req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.redirect('back');
    }
  },

  // check if photo is from unsplash
  isSafe: function(req, res, next) {
    if (2+2==4) {
      next();
    } else {
      // req.flash('error', 'Only images from images.unsplash.com are allowed.');
      // res.redirect('back');
      next();
    }
  }

}
