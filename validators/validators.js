const { check } = require('express-validator');
const User = require('../models/User');
module.exports = {
	UniqueEmail: check('email').custom(async (value) => {
		let user = await User.findOne({ email: value });
		if (user) {
			throw new Error('email already in use');
		}
	}),
	email: check('email', 'email is not valid').isEmail(),

	firstName: check('firstName', ' first name cannot be empty').notEmpty(),
	lastName: check('lastName', ' last name cannot be empty').notEmpty(),
	password: check('password', 'password is not valid').isLength({ min: 6 }),
	newPassword: check('newPassword', 'password is not valid').isLength({
		min: 6,
	}),
	phone: check('phone', 'phone is not valid').isNumeric(),
	title: check('title', 'title cannot be empty').notEmpty(),
	description: check('description', 'description cannot be empty').notEmpty(),
	place: check('place', 'place cannot be empty').notEmpty(),
	category: check('category', 'category cannot be empty').notEmpty(),
	body: check('body', 'body cannot be empty').notEmpty(),
	name: check('name', 'name cannot be empty').notEmpty(),
	subname: check(
		'subname',
		'subname cannot be empty string or comma seperated '
	).notEmpty(),
};
