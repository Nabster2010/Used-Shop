const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const validators = require('../validators/validators');
const { check, validationResult } = require('express-validator');

//get all categories
router.get('', async (req, res) => {
	try {
		let categories = await Category.find();
		return res.json(categories);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});
//add category
router.post('', [validators.name], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	const categoryName = req.body.name.trim().toLowerCase();
	try {
		let category = await Category.create({ name: categoryName });
		return res.json(category);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});

//get category by name
router.get('/:name', async (req, res) => {
	try {
		let category = await Category.findOne({
			name: req.params.name.toString().trim().toLowerCase(),
		});
		if (category) {
			return res.json(category);
		} else {
			return res.status(404).json({ message: 'not found' });
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});

//add subcategory
router.post('/:name', [validators.subname], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	const categoryName = req.params.name.toString().trim().toLowerCase();
	const categorySubname = req.body.subname
		.toString()
		.trim()
		.toLowerCase()
		.split(',');
	try {
		let category = await Category.findOne({ name: categoryName });
		if (!category) {
			return res.status(404).json({ message: 'not found' });
		}
		if (categorySubname.length > 0) {
			category.subname.push(...categorySubname);
			category = await category.save();
			return res.json(category);
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});
//delete full category by name

router.delete('/:name', async (req, res) => {
	const categoryName = req.params.name.toString().trim().toLowerCase();
	try {
		let category = await Category.findOne({ name: categoryName });
		if (!category) {
			return res.status(404).json({ message: 'not found' });
		}
		await Category.deleteOne({ name: categoryName });
		return res.json({ message: 'category deleted' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});
//deleting sub category
router.delete('/:categoryName/:subname', async (req, res) => {
	const categoryName = req.params.categoryName.toString().trim().toLowerCase();
	const subname = req.params.subname.toString().trim().toLowerCase();
	try {
		let category = await Category.findOne({ name: categoryName });
		if (!category) {
			return res.status(404).json({ message: 'category not found' });
		}
		if (!category.subname.includes(subname)) {
			return res.status(404).json({ message: 'sub category not found' });
		}
		category.subname = category.subname.filter(
			(sub) => sub.toLowerCase() !== subname
		);
		await category.save();

		return res.json({ message: `${subname} deleted` });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});

module.exports = router;
