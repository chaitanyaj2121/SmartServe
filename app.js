const express = require("express");
const app = express();
const PORT = 3000;

require("dotenv").config();
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");
const FirestoreStore = require("firestore-store")(session); // Firestore session store
const admin = require("firebase-admin");
const ejsMate = require("ejs-mate");
const path = require("path");

// Import routes
const mainRoutes = require("./routes"); // Main routes index

// Firebase setup
const db = admin.firestore();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Templating
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session configuration
const sessionOptions = {
  store: new FirestoreStore({
    database: db,
    collection: "sessions", // Firestore collection name for sessions
  }),
  secret: process.env.SESSIONSECRET || "yoursecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure cookies in production
  },
};

app.use(session(sessionOptions));
app.use(flash());

// Flash message middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.session.user;
  res.locals.iscustomer = req.session.iscustomer || false;
  res.locals.ismess = req.session.ismess || false;
  res.locals.messFees = req.session.fees;

  if (req.query.redirectUrl) {
    res.locals.redirectUrl = req.query.redirectUrl;
  }
  next();
});

// Use routes
app.use("/", mainRoutes); // Use routes from the routes folder

// Server setup
app.listen(PORT, () => console.log(`App is running on Port: ${PORT}`));


// Handle other routes
app.use('*', (req, res) => {
  res.render("pageNotFound.ejs");
});