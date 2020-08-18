const jwt = require('jsonwebtoken');
const User = require('../models/User');

const loginRequired = async (req, res, next) => {
	try {
		let token = req.headers['x-auth-token'];
		let { id } = await jwt.verify(token, process.env.SECRET_KEY);
		let user = await User.findById(id);
		if (user) {
			req.user = user._id;
			next();
		} else {
			return res.status(401).json({ errors: [{ msg: 'unauthorized' }] });
		}
	} catch (err) {
		console.log(err);
		return res.status(401).json({ errors: [{ msg: 'unauthorized' }] });
	}
};
module.exports = loginRequired;
