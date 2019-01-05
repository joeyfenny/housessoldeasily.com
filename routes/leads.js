var express = require("express");
var router = express.Router();
var Lead = require("../models/lead");
var middleware = require("../middleware");
var request = require("request");
var { isLoggedIn, checkUserLead, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

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

router.post("/newsletter-signup", function(req, res) {
  var email = req.body.email;

  var sendgridCreateContact = {
    json: true,
    method: 'POST',
    url: 'https://api.sendgrid.com/v3/contactdb/recipients',
    headers: {
      Authorization: 'Bearer ' + process.env.SENDGRID
    },
    body: [
      {
        "email": email.toString(),
        "websiteOriginatedFrom": "housessoldeasily.com"
      }
    ]
  };
  request(sendgridCreateContact, function (error, response, body) {
    if(error)console.log(error);
  });
});


router.post("/new", isSafe, function(req, res) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var phoneNumber = req.body.phoneNumber;
  var newLead = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phoneNumber: phoneNumber,
  };

  var sendgridCreateContact = {
    json: true,
    method: 'POST',
    url: 'https://api.sendgrid.com/v3/contactdb/recipients',
    headers: {
      Authorization: 'Bearer ' + process.env.SENDGRID
    },
    body: [
      {
        "email": email.toString(),
        "first_name": firstName.toString(),
        "last_name": lastName.toString(),
        "phoneNumber": phoneNumber.toString(),
        "websiteOriginatedFrom": "housessoldeasily.com"
      }
    ]
  };
  request(sendgridCreateContact, function (error, response, body) {
    console.log(body);
  });

  var options = { method: 'POST',
    url: 'https://api.sendgrid.com/v3/mail/send',
    headers: {
      Authorization: 'Bearer ' + process.env.SENDGRID,
      'Content-Type': 'application/json'
    },
    body:
     { personalizations:
        [ { to: [ { email: email } ],
            subject: 'We are reviewing your property.' } ],
       from: { email: 'support@housessoldeasily.com' },
       content:
        [ { type: 'text/plain',
            value: 'We have received your request for an offer on your property. We are currently evaluating the property and we will get back to you soon. Most people receive a response within 24 hours.' } ] },
    json: true };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
  });

    Lead.create(newLead, function(err, newlyCreated) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/leads');
      }
    });
  });

  router.post("/final-step", function(req, res) {
    var address = req.body.address.split(/,(.+)/)[0];
    var citystatezip = req.body.address.split(/,(.+)/)[1];
    var attomOptions = {
      method: 'GET',
      url: 'https://search.onboard-apis.com/propertyapi/v1.0.0/allevents/detail',
      qs: {
        address1: address,
        address2: citystatezip
      },
      headers: {
        accept: 'application/json',
        apikey: process.env.ATTOM
      }
    };
    request(attomOptions, function (error, response, body) {
      if (error) console.log(error);
      var data = JSON.parse(body).property[0];
      var avm = data.avm;
      var avmpoorlow = JSON.stringify(avm.condition.avmpoorlow);
      var avmpoorhigh = JSON.stringify(avm.condition.avmpoorhigh);
      var avmgoodlow = JSON.stringify(avm.condition.avmgoodlow);
      var avmgoodhigh = JSON.stringify(avm.condition.avmgoodhigh);
      var avmexcellentlow = JSON.stringify(avm.condition.avmexcellentlow);
      var avmexcellenthigh = JSON.stringify(avm.condition.avmexcellenthigh);
      var lat = data.location.latitude;
      var lng = data.location.longitude;
      res.render("leads/final-step", {
        avmpoorlow: avmpoorlow,
        avmpoorhigh: avmpoorhigh,
        avmgoodlow: avmgoodlow,
        avmgoodhigh: avmgoodhigh,
        avmexcellentlow: avmexcellentlow,
        avmexcellenthigh: avmexcellenthigh,
        lat: lat,
        lng: lng,
      });
    });
  });

  router.get("/new", isLoggedIn, function(req, res) {
    res.render("leads/new");
  });

  router.get("/:id", function(req, res) {
    Lead.findById(req.params.id).populate("comments").exec(function(err, foundLead) {
      if (err || !foundLead) {
        console.log(err);
        req.flash('error', 'Sorry, that lead does not exist!');
        return res.redirect('/leads');
      }
      console.log(foundLead);
      res.render("leads/show", {lead: foundLead});
    });
  });

  router.get("/:id/edit", isLoggedIn, checkUserLead, function(req, res) {
    res.render("leads/edit", {lead: req.lead});
  });

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
