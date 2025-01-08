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

// ----------flash msg storing in the locals-------------------------------

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.session.user;


  next();
})

// Ejs mate used for templating
const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);

app.listen(PORT, () => console.log(`App is listing on the Port: ${PORT}`));

//------firebase setup----------

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

//Home route
app.get("/", (req, res) => {
  res.render("home.ejs");
  console.log("home page");

})

// Authentication 
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require("firebase/auth");
const { auth } = require("./firebase-config");
app.get("/signup/business", (rea, res) => {
  res.render("signupBusiness.ejs");
  console.log("Signup form send for business");
})

app.post("/signup/business", async (req, res) => {
  try {
    // Extract fields from req.body
    const { businessName, ownerName, address, phone, rent, email, description, password } = req.body;
    // console.log(req.body);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // console.log("These are user Credentials: " + JSON.stringify(userCredential));
    // console.log(userCredential.user.uid);
    const uid = userCredential.user.uid;



    // Save business details to Firestore
    await db.collection("businesses").add({
      businessName,
      ownerName,
      address,
      phone,
      rent,
      description,
      uid,
      // Save the photo URL
      createdAt: new Date(),
    });

    req.flash("success", "Business registered successfully. Log in now!");
    res.redirect("/");
  } catch (error) {
    console.error("Error while registering business:", error);
    req.flash("error", `Error while registering business: ${error.message}`);
    res.redirect("/signup/business");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
})

app.post("/login", async (req, res) => {

  const { email, password } = req.body;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    req.session.user = userCredential.user;
    req.session.uid=userCredential.user.uid;
    console.log(req.session.uid);
    
    
    req.flash("success", "Login Success!");
    res.redirect("/");
  } catch (error) {
    console.error("Error logging in:", error.message);
    req.flash("error", `${error.message}`);
    res.redirect("/login");
  }

})

app.get("/logout", async (req, res) => {
  try {
    await signOut(auth); // Sign out using Firebase Auth
    console.log("User logged out");
    req.session.user = null;
    req.session.uid=null;
    req.flash("success", "Logout Success!");
    res.redirect("/");
  } catch (error) {
    console.error("Error logging out:", error.message);
    req.flash("error", `${error.message}`);
    res.redirect("/");
  }
})


app.get("/profile",async (req,res) => {
 const uid=req.session.uid;  

 try {
  const businessQuery = db.collection("businesses").where("uid", "==", uid).get();
  const customerQuery = db.collection("customers").where("uid", "==", uid).get();

  const [businessSnap, customerSnap] = await Promise.all([businessQuery, customerQuery]);

  if (!businessSnap.empty) {
    // Extract business data
    const businessData = businessSnap.docs.map(doc => doc.data());
    console.log("Data found in businesses:", businessData);

    // Render profileBusiness.ejs with business data
    return res.render("profileBusiness.ejs", { data: businessData[0] });
  }

  if (!customerSnap.empty) {
    // Extract customer data
    const customerData = customerSnap.docs.map(doc => doc.data());
    console.log("Data found in customers:", customerData);

    // Render profileBusiness.ejs with customer data
    return res.render("profileCustomer.ejs", { data: customerData });
  }

  // If no data found, render with an empty state or handle accordingly
  res.render("profileBusiness.ejs", { data: null });
} 
catch(error){
  console.error("Error while loading profile:", error.message);
    req.flash("error", `${error.message}`);
    res.redirect("/");
}
})