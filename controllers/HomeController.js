const HomeController = {
    getHomePage: (req, res) => {
      res.render("home"); // Render the home page
    },
    getFeatures: (req, res) => {
      res.render("features"); // Render the features page
    },
  };
  
  module.exports = HomeController;
  