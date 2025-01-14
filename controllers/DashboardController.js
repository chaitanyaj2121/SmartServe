// Firebase setup
const admin = require("firebase-admin");
const db = admin.firestore();

const DashboardController={
    getDashboard:async (req, res) => {
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
      
              const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
      
              const currentDate = new Date();
              const isMonthEnded = currentDate >= endDate; // Check if the month has ended or is the same day
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
      //         console.log("Customer ID:", doc.id);
      // console.log("Start Date:", startDate);
      // console.log("End Date:", endDate);
      // console.log("Current Date:", currentDate);
      // console.log("Is Month Ended:", isMonthEnded);
      // console.log("Remaining Days:", remainingDays);
      
      
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
      },

};


module.exports=DashboardController;