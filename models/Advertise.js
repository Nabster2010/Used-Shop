const mongoose = require('mongoose');
const User = require('./User');
const AdvertiseSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	name: {
		type: String,
	},
	avatar: {
		type: String,
	},
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	place: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		required: true,
	},
	subname: {
		type: String,
	},

	img: [],
	comments: [
		{
			user: {
				type: mongoose.Schema.Types.ObjectId,
			},
			name: {
				type: String,
			},
			avatar: {
				type: String,
			},
			body: {
				type: String,
				required: true,
			},
			createdAt: {
				type: Date,
				default: Date.now,
			},
		},
	],
	createdAt: {
		type: Date,
		default: Date.now,
	},
});
module.exports = Advertise = mongoose.model('Advertise', AdvertiseSchema);
