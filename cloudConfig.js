const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config(); // Ensure dotenv is loaded

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY,     
  api_secret: process.env.CLOUD_API_SECRET 
});

// Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'smartserve_DEV', // Ensure this folder exists or will be created
    allowed_formats: ["png", "jpg", "jpeg"], // Fixed the typo here
  },
});

module.exports = {
  cloudinary,
  storage,
};
