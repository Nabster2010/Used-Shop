const User = require('../models/User');
const Message = require('../models/Message');
const message = require('../models/Message');
const { all } = require('../routes');

const addMessage = async (message) => {
	try {
		await Message.create({ ...message });
	} catch (err) {
		console.error(err);
	}
};
const getConversation = async (from, to) => {
	let messagesSent = await Message.find({ from: from, to: to });
	let MessagesReceived = await Message.find({ to: from, from: to });
	return [...messagesSent, ...MessagesReceived].sort(
		(a, b) => a.createdAt - b.createdAt
	);
};
const getUserConversations = async (userId) => {
	let messagesReceived = await Message.find({ to: userId });
	let messagesSent = await Message.find({ from: userId });
	return [...messagesReceived, ...messagesSent];
};
const getUser = async (id) => {
	try {
		return await User.findById(id);
	} catch (err) {
		console.error(err);
	}
};

module.exports = {
	addMessage,
	getConversation,
	getUserConversations,
	getUser,
};
