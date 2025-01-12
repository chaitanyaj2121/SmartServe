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