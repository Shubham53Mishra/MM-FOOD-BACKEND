const cloudinary = require('../config/cloudinary');

exports.uploadImage = (buffer) => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ resource_type: 'image' },
			(error, result) => {
				if (error) return reject(error);
				resolve(result.secure_url);
			}
		);
		stream.end(buffer);
	});
};
