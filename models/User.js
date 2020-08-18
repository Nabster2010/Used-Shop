const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
	firstName: {
		type: String,
		required: true,
	},
	lastName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	phone: {
		type: Number,
		required: true,
	},
	avatar: {
		type: String,
	},
});
module.exports = User = mongoose.model('User', UserSchema);
