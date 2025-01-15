module.exports.isLoggedIn = (req, res, next) => {
    // console.log(req.path, "..", req.originalUrl);
  
    // Check if the user is authenticated by verifying if user data exists in the session
    if (!req.session.user) { 
      // Save the redirect URL to session for later use
      req.session.redirectUrl = req.originalUrl;
      req.flash("error", "You must be logged in!");
      return res.redirect("/login");
    }
  
    // If authenticated, proceed to the next middleware/route handler
    next();
  };
  
  module.exports.ismess=(req,res,next)=>{
    if (!req.session.ismess) {
        req.flash("error","You are not Organization");
        return res.redirect("/");
    }
    next();
  }

  module.exports.isEmailVerified = async (req, res, next) => {
    try {
      // Retrieve the currently authenticated user
      const user = auth.currentUser;
  
      // Check if the user exists
      if (!user) {
        req.flash("error", "You must be logged in to access this feature.");
        return res.redirect("/login"); // Redirect to login if the user is not authenticated
      }
  
      // Check if the user's email is verified
      if (user.emailVerified) {
        return next(); // Email is verified, proceed to the next middleware/route
      }
  
      // If the email is not verified, redirect with an error message
      req.flash("error", "Please verify your email to access this feature.");
      return res.redirect("/verify-email"); // Redirect to a specific email verification page
  
    } catch (error) {
      console.error("Error while checking email verification:", error);
  
      // Handle unexpected errors
      req.flash("error", "An unexpected error occurred. Please try again later.");
      return res.redirect("/login");
    }
  };
  
  