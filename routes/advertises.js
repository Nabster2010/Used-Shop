const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const User = require('../models/User');
const Advertise = require('../models/Advertise');
const paginate = require('express-paginate');
const loginRequired = require('../middleWares/loginRequired');
const validators = require('../validators/validators');
const { check, validationResult } = require('express-validator');

//get all advertises
router.get('', async (req, res) => {
	const title = req.query.title;
	const filter = req.query.filter;
	const place = req.query.place;
	let condition = {
		title: { $regex: new RegExp(title), $options: 'i' },
		subname: { $regex: new RegExp(filter), $options: 'i' },
		place: { $regex: new RegExp(place), $options: 'i' },
	};
	try {
		const [results, itemCount] = await Promise.all([
			Advertise.find(condition)
				.limit(req.query.limit)
				.skip(req.skip)
				.lean()
				.exec(),
			Advertise.countDocuments(condition),
		]);
		const pageNumbers = Math.ceil(itemCount / req.query.limit);
		return res.json({
			pageCount: pageNumbers,
			has_more: paginate.hasNextPages(req)(pageNumbers),
			data: results,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ errors: [{ msg: 'server error' }] });
	}
});
//get  advertises by subname
router.get('/subname/:subname', async (req, res) => {
	try {
		let ads = await Advertise.find({ subname: req.params.subname });
		return res.json(ads);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ errors: [{ msg: 'server error' }] });
	}
});

//get advertise by adId

router.get('/:adId', async (req, res) => {
	try {
		let ad = await Advertise.findById(req.params.adId);
		if (!ad) {
			return res.status(404).json({ errors: [{ msg: 'ad does not exist' }] });
		} else {
			return res.json(ad);
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ errors: [{ msg: 'server error' }] });
	}
});

//add advertise for user
router.post(
	'',
	loginRequired,
	[
		validators.title,
		validators.description,
		validators.place,
		validators.category,
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		const user = await User.findById(req.user).select('-password');
		if (!req.files) {
			return res.status(500).json({ errors: [{ msg: 'file not found' }] });
		}
		//get array of files
		let myFiles = [];
		Array.isArray(req.files.img)
			? (myFiles = req.files.img)
			: myFiles.push(req.files.img);
		const newAD = new Advertise({
			user: req.user,
			name: user.firstName,
			avatar: user.avatar,
			title: req.body.title,
			description: req.body.description,
			place: req.body.place,
			category: req.body.category,
			subname: req.body.subname,
			img: [],
		});
		for (let i = 0; i < myFiles.length; i++) {
			let name = `${uuidv4() + myFiles[i].name}`;
			let path = `/uploads/${name}`;
			newAD.img.push({ name, path });
			myFiles[i].mv(`frontend/public/uploads/${name}`, function (err) {
				if (err) {
					console.log(err);
					return res.status(500).json({ errors: [{ msg: 'error occured' }] });
				}
			});
		}
		try {
			await newAD.save();
			return res.json(newAD);
		} catch (err) {
			console.error(err);
			return res.status(500).json({ errors: [{ msg: 'server error' }] });
		}
	}
);

//update advertise by id

router.put(
	'/:adId',
	loginRequired,
	[
		validators.title,
		validators.description,
		validators.place,
		validators.category,
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		try {
			let ad = await Advertise.findById(req.params.adId);
			if (!ad) {
				return res.status(404).json({ errors: [{ msg: 'ad not found' }] });
			}
			if (req.user.toString() === ad.user.toString()) {
				if (req.files) {
					let myFiles = [];
					Array.isArray(req.files.img)
						? (myFiles = req.files.img)
						: myFiles.push(req.files.img);
					let imgs = [];
					for (let i = 0; i < myFiles.length; i++) {
						let name = `${uuidv4() + myFiles[i].name}`;
						let path = `/uploads/${name}`;
						imgs.push({ name, path });
						myFiles[i].mv(`frontend/public/uploads/${name}`, function (err) {
							if (err) {
								console.log(err);
								return res
									.status(500)
									.json({ errors: [{ msg: 'error occured' }] });
							}
						});
					}
					try {
						ad.img.forEach((img) =>
							fs.unlinkSync(`frontend/public/uploads/${img.name}`)
						);
					} catch (err) {
						console.error(err);
					}
					ad.img = imgs;
				}

				try {
					const { title, description, place, category, subname } = req.body;
					ad.title = title;
					ad.description = description;
					ad.place = place;
					ad.category = category;
					ad.subname = subname;
					await ad.save();
					return res.json(ad);
				} catch (err) {
					console.error(err);
					res.status(500).json({ errors: [{ msg: 'server error' }] });
				}
			} else {
				res.status(401).json({ errors: [{ msg: 'UnAuthorized' }] });
			}
		} catch (err) {
			console.error(err);
			return res.status(500).json({ errors: [{ msg: 'server error' }] });
		}
	}
);

//delete an AD

router.delete('/:adId', loginRequired, async (req, res) => {
	try {
		let ad = await Advertise.findById(req.params.adId.toString());
		if (!ad) {
			return res.status(404).json({ errors: [{ msg: 'ad not found' }] });
		}
		if (req.user.toString() === ad.user.toString()) {
			try {
				await Advertise.findOneAndDelete({ _id: ad._id });
				try {
					ad.img.forEach((img) =>
						fs.unlinkSync(`frontend/public/uploads/${img.name}`)
					);
				} catch (err) {
					console.error(err);
				}
				return res.json({ message: 'deleted successfully' });
			} catch (err) {
				console.error(err);
				res.status(500).json({ message: 'server error' });
			}
		} else {
			return res.status(401).json({ errors: [{ msg: 'unAuthorized' }] });
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'server error' });
	}
});

//add comment on AD
router.post(
	'/:adId/comments',
	loginRequired,
	[validators.body],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		let user = await User.findById(req.user.toString());
		let ad = await Advertise.findById(req.params.adId.toString());
		if (!ad) {
			return res.status(404).json({ errors: [{ msg: 'ad not found' }] });
		}
		try {
			let newComment = {
				user: req.user,
				body: req.body.body,
				name: user.firstName,
				avatar: user.avatar,
			};
			const advertise = await Advertise.findById(req.params.adId);
			advertise.comments.push(newComment);
			await advertise.save();
			return res.json(advertise.comments);
		} catch (err) {
			console.error(err);
			return res.status(500).json({ errors: [{ msg: 'server error' }] });
		}
	}
);
//get all comments on advertise
router.get('/:adId/comments', async (req, res) => {
	try {
		let ad = await Advertise.findOne({ _id: req.params.adId.toString() });

		if (!ad) {
			return res.status(404).json({ errors: [{ msg: 'ad not found' }] });
		}
		let comments = ad.comments;
		if (comments.length > 0) {
			return res.json(comments);
		} else {
			return res.json({ message: 'no comments' });
		}
	} catch (err) {
		console.error(err);
		return res.status(404).json({ errors: [{ msg: 'ad not found' }] });
	}
});
//delete comment (comment owner or advertiser)
router.delete('/:adId/comments/:commentId', loginRequired, async (req, res) => {
	let ad = await Advertise.findById(req.params.adId.toString());
	if (ad.user.toString() === req.user.toString()) {
		try {
			await Advertise.findOneAndUpdate(
				{ _id: req.params.adId.toString() },
				{ $pull: { comments: { _id: req.params.commentId } } }
			);
			return res.json({ message: 'deleted successfully' });
		} catch (err) {
			console.error(err);
			res.status(404).json({ errors: [{ msg: 'not found' }] });
		}
	} else {
		return res.status(500).json({ errors: [{ msg: 'unauthorized' }] });
	}
});

module.exports = router;
