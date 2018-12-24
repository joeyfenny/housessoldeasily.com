var express     = require("express"),
app         = express(),
bodyParser  = require("body-parser"),
mongoose    = require("mongoose"),
passport    = require("passport"),
cookieParser = require("cookie-parser"),
flash        = require("connect-flash"),
LocalStrategy = require("passport-local"),
Lead  = require("./models/lead"),
User        = require("./models/user"),
session = require("express-session"),
methodOverride = require("method-override");

// configure dotenv
require('dotenv').load();

// requiring routes
var indexRoutes = require("./routes/index");
var leadRoutes = require("./routes/leads");

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const databaseUri = process.env.MONGODB_URI;

mongoose.connect(databaseUri, { useMongoClient: true })
.then(() => console.log(`The MongoDB database was connected successfully.`))
.catch(err => console.log(`MongoDB connection error: ${err.message}` + 'Make sure MongoDB installed and running and that you have the proper connection URI.'));

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(methodOverride('_method'));
app.use(cookieParser('secret'));

// require moment
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret: "My server secret here.",
  resave: false,
  saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use("/", indexRoutes);
app.use("/leads", leadRoutes);
app.use(function(req, res, next){
    res.status(404).render('404');
});

app.set('port', process.env.PORT || 3000);
app.listen(process.env.PORT, process.env.IP, function(){
  console.log("App is now running on port " + app.get('port') + '.');
});
