const express = require("express");
const router = express.Router();

const multer = require("multer");
const { storage, cloudinary } = require("../cloudConfig");
const upload = multer({ storage });

// Firebase setup
const admin = require("firebase-admin");

const serviceAccount = require("../requirements/cityyanta-376f2-firebase-adminsdk-uk1j3-bc35af82a8.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const { body } = require("express-validator");

const { auth } = require("../firebase-config");
const { isLoggedIn, ismess } = require('../middlewares');

// Import controllers
const HomeController = require("../controllers/HomeController");
const AuthController = require("../controllers/AuthController");
const ProfileController = require("../controllers/ProfileController");
const CustomerController = require("../controllers/CustomerController");
const DashboardController = require("../controllers/DashboardController");
const NotificationController = require("../controllers/NotificationController");
const NearbyController = require("../controllers/NearbyController");


// Home routes
router.get("/", HomeController.getHomePage);
router.get("/features", HomeController.getFeatures);

router.get("/test",(err,req,res,next)=>{
next(err);
})
// Auth routes
router.get("/signup/business", AuthController.getBusinessSignupForm);
router.post("/signup/business", upload.single('businessImage'), AuthController.registerBusiness);

router.get("/signup/user", AuthController.getSignupformForCustomer);
router.post("/signup/user", AuthController.registerCustomer);

router.get("/login", AuthController.getLoginForm);

router.post("/login",[
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
],AuthController.login);

router.get("/logout", AuthController.logout)

// Profile routes
router.get("/profile", isLoggedIn, ProfileController.getProfile)
router.get('/profile/edit_b/:id', isLoggedIn, ismess, ProfileController.getProfileEditFormForBusiness);
router.post("/profile/edit_b/:id", isLoggedIn, ismess, ProfileController.editBusinessProfile);


// Customer routes  
router.get("/customers", isLoggedIn, ismess, CustomerController.getCustomers);

router.post("/customers/add", isLoggedIn, ismess, upload.single('customerImage'), CustomerController.addCustomer);
router.post("/customers/update/:id", isLoggedIn, ismess, CustomerController.updateCustomer);
router.post("/delete-customer", isLoggedIn, ismess, CustomerController.deleteCustomer);
router.post("/renew-customer", isLoggedIn, ismess, CustomerController.renewCustomer);

// Dashboard routes
router.get("/dashboard", isLoggedIn, ismess, DashboardController.getDashboard);

// Notifications routes
router.get("/notifications", isLoggedIn, ismess, NotificationController.getNotifications);


// Nearby routes
router.get("/nearby", isLoggedIn, NearbyController.getNearByOrganizations);

module.exports = router;
