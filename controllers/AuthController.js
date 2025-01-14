// AuthController.js

// Authentication 

// Firebase setup
const admin = require("firebase-admin");
const db = admin.firestore();

const { signInWithEmailAndPassword, sendEmailVerification ,createUserWithEmailAndPassword, signOut } = require("firebase/auth");

const { auth } = require("../firebase-config");
const AuthController = {
  getBusinessSignupForm: (req, res) => {
    if (req.session.user) {
      req.flash("error", "already loged in!!")
      return res.redirect("/");
    }
    res.render("signupBusiness.ejs");
    console.log("Signup form send for business");
  },
  registerBusiness: async (req, res) => {
    let url = req.file.path;
    let fileName = req.file.filename;

    try {
      // Extract fields from req.body
      const { businessName, ownerName, address, phone, rent, email, description, password } = req.body;
      // console.log(req.body);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // console.log("These are user Credentials: " + JSON.stringify(userCredential));
      // console.log(userCredential.user.uid);
      const uid = userCredential.user.uid;


      await sendEmailVerification(userCredential.user);
      // Save business details to Firestore
      await db.collection("businesses").add({
        businessName,
        ownerName,
        address,
        phone,
        rent,
        description,
        uid,
        businessImage: { url, fileName },
        // Save the photo URL
        createdAt: new Date(),

      });


      req.flash("success", "Verification Mail Sent Successfully. Please verify");
      res.redirect("/login");
    } catch (error) {
      console.error("Error while registering business:", error);
      req.flash("error", `Error while registering business: ${error.message}`);
      res.redirect("/signup/business");
    }
  },
  getLoginForm: (req, res) => {
    res.render("login.ejs");
  },
  login: async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Attempt to sign in the user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Check if the email is verified
      if (!user.emailVerified) {
        req.flash("error", "Please verify your email from inbox before logging in.");
        return res.redirect("/login"); // Redirect to the email verification page
      }
  
      // Store user details in the session
      req.session.user = user;
      req.session.uid = user.uid;
  
      const uid = user.uid;
  
      // Firestore queries for businesses and customers
      const businessQuery = db.collection("businesses").where("uid", "==", uid).get();
      const customerQuery = db.collection("customers").where("uid", "==", uid).get();
  
      const [businessSnap, customerSnap] = await Promise.all([businessQuery, customerQuery]);
  
      // Check if the user is a business
      if (!businessSnap.empty) {
        req.session.ismess = true;
  
        const businessData = businessSnap.docs[0].data();
        req.session.fees = businessData.rent;
      }
  
      // Check if the user is a customer
      if (!customerSnap.empty) {
        req.session.iscustomer = true;
      }
  
      // Redirect to the previous page or home page after login
      const redirectUrl = req.session.redirectUrl || "/";
      req.flash("success", "Login successful!");
      res.redirect(redirectUrl);
    } catch (error) {
      // Handle login errors
      console.error("Error logging in:", error.message);
      req.flash("error", `${error.message}`);
      res.redirect("/login"); // Redirect back to the login page in case of an error
    }
  }
  ,
  logout: async (req, res) => {
    try {
      await signOut(auth); // Sign out using Firebase Auth
      console.log("User logged out");
      req.session.user = null;
      req.session.uid = null;
      req.session.iscustomer = null;
      req.session.ismess = null;
      req.session.fees = null;
      req.flash("success", "Logout Success!");
      res.redirect("/");
    } catch (error) {
      console.error("Error logging out:", error.message);
      req.flash("error", `${error.message}`);
      res.redirect("/");
    }
  },
  getSignupformForCustomer:
    (req, res) => {
      res.render("signupCustomers.ejs");
    },
  registerCustomer: async (req, res) => {
    const { fullName, mobile, email, password, } = req.body;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await db.collection("customers").add({
        fullName,
        mobile,
        uid,
        createdAt: new Date(),
      });
      req.flash("success", "Signup Success login now!");
      res.redirect("/login");
    }
    catch (error) {
      console.log(error);

      req.flash("error", `${error.message}`);
      res.redirect("/signup/user");
    }
  },
};

module.exports = AuthController;
