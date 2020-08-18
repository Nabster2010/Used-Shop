const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const loginRequired = require('../middleWares/loginRequired');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult, check } = require('express-validator');
//custom validators
const validators = require('../validators/validators');

//signup route
router.get('/', loginRequired, async (req, res) => {
	try {
		const user = await User.findById(req.user).select('-password');
		res.json(user);
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
});
router.post(
	'/signup',
	[
		validators.UniqueEmail,
		validators.email,
		validators.firstName,
		validators.lastName,
		validators.password,
		validators.phone,
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		} else {
			let user = new User(req.body);
			//hash the password
			user.password = bcrypt.hashSync(req.body.password, 8);

			if (!req.files) {
				user.avatar = '/uploads/avatar.png';
			} else {
				let name = `${uuidv4() + req.files.avatar.name}`;
				let path = `/uploads/${name}`;
				req.files.avatar.mv(`frontend/public/uploads/${name}`, function (err) {
					if (err) {
						console.log(err);
						return res.status(500).json({ errors: [{ msg: 'error occured' }] });
					}
				});
				user.avatar = path;
			}
			try {
				user = await user.save();
				jwt.sign(
					{ id: user._id },
					process.env.SECRET_KEY,
					{ expiresIn: '5 days' },
					(err, token) => {
						if (err) throw err;
						console.log(token);
						return res.json({ token });
					}
				);
			} catch (err) {
				console.log(err);
				res.status(500).send('server error');
			}
		}
	}
);
//sign in route

router.post(
	'/signin',
	[
		check('email', 'Email cannot be empty').notEmpty(),
		check('password', 'password cannot be empty').notEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password } = req.body;

		try {
			let user = await User.findOne({ email });
			//if user exists generate the token
			if (user && bcrypt.compareSync(password, user.password)) {
				const token = await jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
					expiresIn: '5 days',
				});
				console.log(token);

				return res.json(token);
			} else {
				return res
					.status(400)
					.json({ errors: [{ msg: 'invalid credintials' }] });
			}
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({ errors: [{ msg: 'server error' }] });
		}
	}
);

module.exports = router;
