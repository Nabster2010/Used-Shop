const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
	},
	from: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	senderName: {
		type: String,
		required: true,
	},
	senderAvatar: {
		type: String,
		required: true,
	},
	to: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},

	createdAt: {
		type: Date,
		default: Date.now,
	},
	receiverName: {
		type: String,
		required: true,
	},
	receiverAvatar: {
		type: String,
		required: true,
	},
	isOpened: {
		type: Boolean,
		default: false,
	},
});
module.exports = Message = mongoose.model('Message', MessageSchema);
