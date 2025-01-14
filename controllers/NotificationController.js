// Firebase setup
const admin = require("firebase-admin");
const db = admin.firestore();

const NotificationController={
    getNotifications:async (req, res) => {
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
      },
};

module.exports=NotificationController;