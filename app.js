const express = require('express');
const app = express();
const PORT = 3030;


app.use(express.json());
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files for form submission (e.g., CSS, JS, etc.)
app.use(express.static('public'));
const flash = require("connect-flash");


const session = require("express-session");
const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {    // ek hafte me woh bhul jayega of puchega fir se login karo 
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};


app.use(session(sessionOptions));
app.use(flash());

// --------------------------------------flash msg-----------------------------------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  // we are using this in navbar.ejs you can see that
  res.locals.currUser = req.user;
      //  console.log(req.user);
       
  next();
})


const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);
app.listen(PORT, () => console.log(`App is listing on the Port: ${PORT}`));

//firebase setup

const admin = require('firebase-admin');

const serviceAccount = require('./requirements/cityyanta-376f2-firebase-adminsdk-uk1j3-bc35af82a8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const storage = admin.storage();

 
const path = require("path");
const { log } = require('console');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// To parse the data or params comes in req or es
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/",(req,res)=>{
   res.render("home.ejs");
   console.log("home page");
   
})
