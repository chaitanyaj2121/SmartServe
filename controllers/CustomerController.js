// Firebase setup
const admin = require("firebase-admin");
const db = admin.firestore();
const multer = require("multer");
const { storage, cloudinary } = require("../cloudConfig");
const upload = multer({ storage });


const CustomerController={
getCustomers:async (req, res) => {
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
  },
  addCustomer: async (req, res) => {
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
    },
    updateCustomer:async (req, res) => {
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
      },
      deleteCustomer:async (req, res) => {
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
      },
      renewCustomer:async (req, res) => {
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
      },
};

module.exports=CustomerController;