const express = require('express');
const app = express();
const PORT = 3000;


app.use(express.json());
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const { storage ,cloudinary} = require("./cloudConfig");
//multer used for the parsing the data from the file
const multer = require('multer')
const upload = multer({ storage })

require('dotenv').config();
// Serve static files for form submission (e.g., CSS, JS, etc.)
app.use(express.static('public'));
const flash = require("connect-flash");


const session = require("express-session");
const sessionOptions = {
  secret: process.env.SESSIONSECRET,
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


const path = require("path");
const { log } = require('console');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// To parse the data or params comes in req or es
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// ----------flash msg storing in the locals-------------------------------

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.session.user;
  res.locals.iscustomer = req.session.iscustomer || false;
  res.locals.ismess = req.session.ismess || false;
  res.locals.messFees = req.session.fees;
   // Set the redirect URL if it exists in query parameters
   if (req.query.redirectUrl) {
    res.locals.redirectUrl = req.query.redirectUrl;
  }

  next();
})
//Home route
app.get("/", (req, res) => {
  res.render("home.ejs");
  console.log("home page");

})
app.get("/check", (req, res) => {
  res.render("signupCustomers.ejs");
})

// Authentication 
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require("firebase/auth");
const { auth } = require("./firebase-config");
const { isLoggedIn, ismess } = require('./middlewares');

app.get("/features",(req,res)=>{
  res.render("features.ejs");
})

app.get("/signup/business", (req, res) => {
  if ( req.session.user) {
   req.flash("error","already loged in!!")
   return res.redirect("/");
  }
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
    req.session.uid = userCredential.user.uid;
    const uid = userCredential.user.uid;

    const businessQuery = db.collection("businesses").where("uid", "==", uid).get();
    const customerQuery = db.collection("customers").where("uid", "==", uid).get();

    const [businessSnap, customerSnap] = await Promise.all([businessQuery, customerQuery]);
    
    if (!businessSnap.empty) {
      req.session.ismess = true;
      
      const businessData = businessSnap.docs[0].data(); 
      req.session.fees= businessData.rent;
      //  console.log(req.session.fees);
       
    }

    if (!customerSnap.empty) {
      req.session.iscustomer = true;
    }
    const redirectUrl=  req.session.redirectUrl || "/";
    req.flash("success", "Login Success!");
    res.redirect(redirectUrl);  // Redirect to the homepage or dashboard after successful login
  } catch (error) {
    console.error("Error logging in:", error.message);
    req.flash("error", `${error.message}`);
    res.redirect("/login");  // Redirect back to the login page if there's an error
  }
});


app.get("/logout", async (req, res) => {
  try {
    await signOut(auth); // Sign out using Firebase Auth
    console.log("User logged out");
    req.session.user = null;
    req.session.uid = null;
    req.session.iscustomer = null;
    req.session.ismess = null;
    req.session.fees=null;
    req.flash("success", "Logout Success!");
    res.redirect("/");
  } catch (error) {
    console.error("Error logging out:", error.message);
    req.flash("error", `${error.message}`);
    res.redirect("/");
  }
})


app.get("/profile", isLoggedIn, async (req, res) => {
  const uid = req.session.uid;

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
      return res.render("profileCustomer.ejs", { data: customerData[0] });
    }

    // If no data found, render with an empty state or handle accordingly
    res.render("profileBusiness.ejs", { data: null });
  }
  catch (error) {
    console.error("Error while loading profile:", error.message);
    req.flash("error", `${error.message}`);
    res.redirect("/");
  }
})

app.get('/profile/edit_b/:id', isLoggedIn, ismess, async (req, res) => {
  const userId = req.params.id;

  try {
    // Perform the Firestore query asynchronously to get the business data based on userId
    const businessQuerySnapshot = await db.collection("businesses").where("uid", "==", userId).get();

    // If the query is successful and returns data
    if (!businessQuerySnapshot.empty) {
      // Assume there's only one document that matches the uid, get the first document's data
      const businessData = businessQuerySnapshot.docs[0].data();

      // Return the data as an object to the client or render the page
      res.render("edit_bprofile.ejs", { businessData });  // For example, sending the business data as a JSON response
    }
  } catch (error) {
    console.error('Error fetching business data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/profile/edit_b/:id", isLoggedIn, ismess, async (req, res) => {
  const userId = req.params.id; // Extract userId from route parameters
  const { businessName, ownerName, address, phone, rent, description } = req.body;

  try {
    // Query the businesses collection to find the document with the matching userId
    const querySnapshot = await db.collection("businesses").where("uid", "==", userId).get();

    if (!querySnapshot.empty) {
      // Assuming userId is unique, get the first document
      const doc = querySnapshot.docs[0];

      // Update the document with the new data
      await db.collection("businesses").doc(doc.id).update({
        businessName,
        ownerName,
        address,
        phone,
        rent,
        description,
      });
      req.flash("success", "Profile Updated Successfully!")
      res.redirect("/profile"); // Redirect to the profile page after updating
    }
  } catch (error) {
    console.error("Error updating business profile:", error);
    req.flash("error", `${error.message}`);
    res.redirect(`/profile/edit_b/${userId}`);
  }
});

app.get("/signup/user", (req, res) => {
  res.render("signupCustomers.ejs");
})

app.post("/signup/user", async (req, res) => {
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
})

app.get("/customers", isLoggedIn, ismess, async (req, res) => {
  const messId = req.session.uid; // Assuming `messId` is stored in the session
  let customers = [];

  try {
    // Fetch customers whose `messId` matches the owner's `messId`
    const customersSnapshot = await db.collection("customers")
      .where("messId", "==", messId)
      .get();

    if (!customersSnapshot.empty) {
      // Map customers and sort them by `feesRemaining` in descending order
      customers = customersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.feesRemaining || 0) - (a.feesRemaining || 0)); // Ensure feesRemaining exists
    }

    res.render("customers.ejs", { customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).send("Error fetching customers.");
  }
});



app.post("/customers/add",isLoggedIn,ismess, upload.single('customerImage'), isLoggedIn, ismess, async (req, res) => {
  let url=req.file.path;
  let fileName=req.file.filename;

    const { name, mobile, start_date, feesPaid} = req.body;
    const messId=req.session.uid;  
    try {
      await db.collection("customers").add({
        name,
        mobile: mobile || null, // Allow null if no mobile is provided
        start_date: new Date(start_date),
        messId,
        feesPaid, 
        customerImage: {url,fileName},
        createdAt: new Date(),
      });
      req.flash("success","Customer Addmited Successfully!!");
      res.redirect("/customers");
    } catch (error) {
      req.flash("error",`${error.message}`)
  res.redirect("/customers");
    }
});

app.post("/customers/update/:id", isLoggedIn, ismess, async (req, res) => {
  try {
    const custId = req.params.id;
    const { name, mobile, start_date, feesPaid, suttya } = req.body;

    const customerRef = db.collection("customers").doc(custId);

    // Fetch the existing customer document
    const customerSnapshot = await customerRef.get();

    // Get the existing customer data
    const customerData = customerSnapshot.data();

    let updatedStartDate = customerData.start_date.toDate();

    // Extend the date if `suttya` is provided
    if (suttya) {
      const daysToExtend = parseInt(req.body.suttya, 10) || 0;
      updatedStartDate.setDate(updatedStartDate.getDate() + daysToExtend); // Extend the date
    }

    // Prepare the updated fields
    const updatedData = {
      name: name || customerData.name,
      mobile: mobile || customerData.mobile,
      start_date: updatedStartDate, // Store the updated Date object
      feesPaid: feesPaid || customerData.feesPaid,
    };

    // Update the document in Firestore
    await customerRef.update(updatedData);
    req.flash("success", "Updation Success!");
    res.redirect("/dashboard");
  } catch (error) {
    req.flash("error", `${error.message}`)
    res.redirect("/dashboard");
  }
});

app.get("/dashboard", isLoggedIn, ismess, async (req, res) => {
  const messId = req.session.uid;
  let customers = [];
  const fees= req.session.fees;

  try {
    const customersSnapshot = await db
      .collection("customers")
      .where("messId", "==", messId)
      .get();

    if (!customersSnapshot.empty) {
      const batch = db.batch(); // Firestore batch operation for atomic updates

      customers = customersSnapshot.docs.map(doc => {
        const data = doc.data();
        const startDate = data.start_date.toDate();

        // Determine the number of days in the current month
        const monthDays = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();

        // Calculate the endDate (one month from the start date)
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const currentDate = new Date();
        const isMonthEnded = currentDate > endDate; // Check if the month has ended
        let remainingDays = Math.ceil((endDate - currentDate) / (24 * 60 * 60 * 1000));

        if (remainingDays < 0) remainingDays = 0; // Ensure no negative remaining days

        // If the month has ended, update the start date and reset feesPaid
        if (isMonthEnded) {
          const newStartDate = new Date(endDate); // Next month start date
          data.start_date = newStartDate; // Update in the local object
          data.feesPaid = 0; // Reset feesPaid to 0

          // Update the database
          const customerRef = db.collection("customers").doc(doc.id);
          batch.update(customerRef, {
            start_date: newStartDate,
            feesPaid: 0,
          });
        }

        return {
          id: doc.id,
          ...data,
          startDate,
          endDate,
          isMonthEnded,
          remainingDays,
          feesRemaining: fees - (data.feesPaid || 0), // Default fees amount
          monthDays, // Days in the current month for calculations
        };
      });

      // Commit the batch updates if any
      await batch.commit();

      // Sort customers by fees remaining in descending order
      customers.sort((a, b) => b.feesRemaining - a.feesRemaining);
    }

    res.render("dashboard.ejs", { customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    req.flash("error","Error while loading");
   res.redirect("/dashboard");
  }
});

app.post("/delete-customer",isLoggedIn,ismess, async (req, res) => {
  const { customerId } = req.body;

  try {
    // Retrieve the customer's document
    const customerDoc = await db.collection("customers").doc(customerId).get();

    if (!customerDoc.exists) {
      req.flash("error", "Customer not found!");
      return res.redirect("/dashboard");
    }

    const customerData = customerDoc.data();

    // Check if the customer has a customerImage and fileName
    if (customerData.customerImage && customerData.customerImage.fileName) {
      const fileName = customerData.customerImage.fileName;

      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(fileName);
    }

    // Delete the customer document from Firestore
    await db.collection("customers").doc(customerId).delete();

    req.flash("success", "Customer deleted successfully!");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error deleting customer:", error);
    req.flash("error", "Error deleting customer.");
    res.status(500).send("Error deleting customer.");
  }
});


app.post("/renew-customer",isLoggedIn,ismess, async (req, res) => {
  const { customerId } = req.body;

  try {
    // Get the current date
    const newStartDate = new Date();

    // Update the customer's start_date in Firestore
    await db.collection("customers").doc(customerId).update({
      start_date: newStartDate,
      feesPaid: 0,
    });

    // Redirect back to the dashboard or send a success response
    req.flash("success","Renew Success!");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error renewing customer:", error);
   
    req.flash("error", "Error renewing customer.");
    res.redirect("/dashboard");
  }
});

app.get("/notifications", isLoggedIn, ismess, async (req, res) => {
  const messId = req.session.uid;
  const today = new Date(); // Get today's date
  today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison

  try {
    const customersSnapshot = await db
      .collection("customers")
      .where("messId", "==", messId)
      .get();

    let todaysCustomers = [];

    if (!customersSnapshot.empty) {
      todaysCustomers = customersSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const startDate = data.start_date.toDate();
          if (startDate.toDateString() === today.toDateString()) {
            return {
              id: doc.id,
              ...data,
            };
          }
        })
        .filter(Boolean); // Remove undefined entries
    }

    res.render("notifications.ejs", { todaysCustomers });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).send("Error fetching notifications.");
  }
});



app.get("/nearby", isLoggedIn, async (req, res) => {
  try {
    // Fetch all documents from the 'businesses' collection
    const businessesSnapshot = await db.collection("businesses").get();

    // Check if there are any documents
    if (businessesSnapshot.empty) {
      req.flash("error", "No businesses found!");
      return res.render("nearby", { businesses: [] }); // Render nearby page with an empty list
    }

    // Map the documents into an array of business objects
    const businesses = businessesSnapshot.docs.map(doc => ({
      id: doc.id, // Document ID
      ...doc.data() // Spread the document data
    }));

    // Render a page to show the list of businesses
    res.render("nearby", { businesses });

  } catch (error) {
    console.error("Error fetching businesses:", error);
    req.flash("error", `Error fetching businesses: ${error.message}`);
    res.redirect("/");
  }
});

// Handle other routes
app.use('*', (req, res) => {
  res.render("pageNotFound.ejs");
});