const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const bcrypt = require('bcrypt');
const { validationResult, check } = require('express-validator');
const User = require('../models/User');
const Advertise = require('../models/Advertise');
const validators = require('../validators/validators');
const loginRequired = require('../middleWares/loginRequired');

//get all users
router.get('', async (req, res) => {
	const users = await User.find();
	if (users.length) {
		return res.json(users);
	}
	return res.status(404).json({ message: 'there is no users' });
});
//get user by id
router.get('/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (user) {
			let ads = await Advertise.find({ user: user._id });
			return res.json({ user, ads });
		}
		return res.status(404).json({ message: 'user not found' });
	} catch (err) {
		console.error(err);
		return res.status(500).send('server error');
	}
});
//update user
router.put(
	'/:id',
	[
		validators.firstName,
		validators.lastName,
		validators.newPassword,
		validators.phone,
	],
	loginRequired,
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		if (req.user.toString() !== req.params.id.toString()) {
			return res.status(401).json({ errors: [{ msg: 'unauthorized' }] });
		}

		try {
			let user = await User.findOne({ _id: req.params.id });
			let match = bcrypt.compareSync(req.body.oldPassword, user.password);
			if (!match) {
				return res.status(422).json({ errors: [{ msg: 'wrong password' }] });
			}

			user.password = bcrypt.hashSync(req.body.newPassword, 8);
			user.firstName = req.body.firstName;
			user.lastName = req.body.lastName;
			user.phone = req.body.phone;

			if (req.files) {
				if (user.avatar !== '/uploads/avatar.png') {
					try {
						fs.unlinkSync(`frontend/public/${user.avatar}`);
					} catch (err) {
						console.error(err);
					}
				} else {
				}
				let name = `${uuidv4() + req.files.avatar.name}`;
				let path = `/uploads/${name}`;
				req.files.avatar.mv(`frontend/public/uploads/${name}`, function (err) {
					if (err) {
						console.log(err);
						return res
							.status(500)
							.json({ errors: [{ msg: 'file upload error' }] });
					}
				});
				user.avatar = path;
			}

			try {
				await user.save();
				return res.send('updated successfully');
			} catch (err) {
				return res.status(500).json({ errors: [{ msg: 'server error' }] });
			}
		} catch (err) {
			console.error(err);
			return res.status(404).json({ errors: [{ msg: 'user not found' }] });
		}
	}
);

router.delete('/:id', async (req, res) => {
	try {
		await User.deleteOne({ _id: req.params.id });
		res.json({ message: 'deleted' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'server error' });
	}
});
//add new user
router.post('', async (req, res) => {
	try {
		const user = await User.create(req.body);
		return res.json(user);
	} catch (err) {
		console.error(err);
		return res.status(500).send('server error');
	}
});
//delete user account and ads
router.delete('', loginRequired, async (req, res) => {
	try {
		await User.findByIdAndRemove(req.user.toString());
		await Advertise.deleteMany({ user: req.user.toString() });
		return res.json({ message: 'user deleted' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});
//get all advertises by userId

router.get('/:userId/advertises', async (req, res) => {
	try {
		const ads = await Advertise.find({ user: req.params.userId });
		res.json(ads);
	} catch (err) {
		res.status(500).json({ errors: [{ msg: 'server error' }] });
	}
});

module.exports = router;
