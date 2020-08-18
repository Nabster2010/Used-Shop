const express = require('express');
const router = express.Router();
const loginRequired = require('../middleWares/loginRequired');
const User = require('../models/User');
const Advertise = require('../models/Advertise');

router.get('', loginRequired, async (req, res) => {
	try {
		const user = await User.findById(req.user);

		res.send(`hello ${user.firstName}`);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'server error' });
	}
});

module.exports = router;
