// Firebase setup
const admin = require("firebase-admin");
const db = admin.firestore();

const ProfileController={
getProfile:async (req, res) => {
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
  },
  getProfileEditFormForBusiness:
  async (req, res) => {
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
    },
    editBusinessProfile:async (req, res) => {
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
      },
};

module.exports=ProfileController;