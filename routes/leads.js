var express = require("express");
var router = express.Router();
var Lead = require("../models/lead");
var middleware = require("../middleware");
var axios = require("axios");
var {
  isLoggedIn,
  checkUserLead,
  checkUserComment,
  isAdmin,
  isSafe
} = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all leads route=/leads/
router.get("/", function(req, res) {
  if (req.query.search && req.xhr) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // Get all leads from DB
    Lead.find({
      name: regex
    }, function(err, allLeads) {
      if (err) {
        console.log(err);
      } else {
        res.status(200).json(allLeads);
      }
    });
  } else {
    // Get all leads from DB
    Lead.find({}, function(err, allLeads) {
      if (err) {
        console.log(err);
      } else {
        if (req.xhr) {
          res.json(allLeads);
        } else {
          res.render("leads/thank-you", {
            leads: allLeads,
            page: 'thank-you'
          });
        }
      }
    });
  }
});

//CREATE - add new lead to DB, route=/leads/
router.post("/new", isSafe, function(req, res) {
  // get data from form and add to leads array
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var phoneNumber = req.body.phoneNumber;
  var streetAddress = req.body.streetAddress;
  var city = req.body.city;
  var state = req.body.state;
  var zipCode = req.body.zipCode;
  var newLead = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phoneNumber: phoneNumber,
    streetAddress: streetAddress,
    city: city,
    state: state,
    zipCode: zipCode
  };
  // Create a new lead and save to DB
  Lead.create(newLead, function(err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/leads');
    }
  });
});

router.post("/final-step", function(req, res) {

  var zillowEndpoint = 'http://www.zillow.com/webservice/GetDeepSearchResults.htm';
  var address = req.body.address.split(/,(.+)/)[0];
  var citystatezip = req.body.address.split(/,(.+)/)[1];

  axios.get(zillowEndpoint, {
    params: {
      'zws-id': process.env.ZWSID,
      'address': address,
      'citystatezip': citystatezip
    }
  })
  .then(function (response) {
    console.log(response);
    res.render("leads/final-step", {data: response});
  })
  .catch(function (error) {
    console.log(error);
  });

});

//NEW - route to render form to create a new lead, route=/leads/new
router.get("/new", isLoggedIn, function(req, res) {
  res.render("leads/new");
});

// SHOW - shows info about one lead by id, route=/leads/:id
router.get("/:id", function(req, res) {
  //find the lead with provided ID
  Lead.findById(req.params.id).populate("comments").exec(function(err, foundLead) {
    if (err || !foundLead) {
      console.log(err);
      req.flash('error', 'Sorry, that lead does not exist!');
      return res.redirect('/leads');
    }
    console.log(foundLead);
    //render show template with that lead
    res.render("leads/show", {lead: foundLead});
  });
});

// EDIT - shows edit form for a lead by id, route=/leads/:id/edit
router.get("/:id/edit", isLoggedIn, checkUserLead, function(req, res) {
  //render edit template with that lead
  res.render("leads/edit", {lead: req.lead});
});

// PUT - updates lead in the database by id, route=/leads/:id
router.put("/:id", isSafe, function(req, res) {
  var newData = {
    name: req.body.name,
    image: req.body.image,
    description: req.body.description,
    cost: req.body.cost
  };
  Lead.findByIdAndUpdate(req.params.id, {
    $set: newData
  }, function(err, lead) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      req.flash("success", "Successfully Updated!");
      res.redirect("/leads/" + lead._id);
    }
  });
});

module.exports = router;
