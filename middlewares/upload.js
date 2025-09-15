const multer = require('multer');

// Use disk storage for compatibility with Cloudinary and file uploads
const path = require('path');
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/');
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
	}
});
const upload = multer({ storage });

module.exports = upload;
