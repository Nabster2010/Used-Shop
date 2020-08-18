const mongoose = require('mongoose');

module.exports = Category = mongoose.model(
	'Category',
	new mongoose.Schema({
		name: {
			type: String,
			unique: true,
			required: true,
		},
		subname: [String],
	})
);
