const multer = require('multer');

// Use memory storage for direct buffer access
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
