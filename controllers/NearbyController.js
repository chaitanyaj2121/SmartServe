// Firebase setup
const admin = require("firebase-admin");
const db = admin.firestore();

const NearbyController={
  getNearByOrganizations:
  async (req, res) => {
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
  },
};

module.exports=NearbyController;