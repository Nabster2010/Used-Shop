const express = require('express');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const cors = require('cors');
const paginate = require('express-paginate');
require('dotenv').config();
const connectDB = require('./config/db');
const {
	addMessage,
	getConversation,
	getUserConversations,
	getUser,
} = require('./chat/chatHelpers');

//connect db
connectDB();
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//cors origin

const corsOptions = {
	origin: 'http://localhost:3000',
};
app.use(
	fileUpload({
		createParentPath: true,
	})
);
app.use(cors());
app.use(morgan('dev'));
app.use(paginate.middleware(10, 50));
// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// routes

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/advertises', require('./routes/advertises'));
app.use('/api/auth', require('./routes/auth'));
app.use('/categories', require('./routes/categories'));
app.get('/chat', (req, res) => {
	res.send('hello from chat');
});

//socket io

io.on('connection', (socket) => {
	console.log('user connected');

	socket.on('join', async ({ user }, cb) => {
		socket.join(user._id);
		socket.user = user;
		cb();
	});
	socket.on(
		'sendMessage',
		async ({ text, from, senderAvatar, to, createdAt }) => {
			let sender = await getUser(from);
			let senderName = sender.firstName;
			let receiver = await getUser(to);
			let receiverName = receiver.firstName;
			let receiverAvatar = receiver.avatar;
			const message = {
				text,
				from,
				senderName,
				senderAvatar,
				to,
				createdAt,
				receiverName,
				receiverAvatar,
			};
			//save the message to db
			await addMessage(message);
			//send the private message
			socket.broadcast.to(to).emit('message', message);
		}
	);
	//fetch the conversation
	socket.on('fetchConverstaion', async ({ from, to }, cb) => {
		let conversation = await getConversation(from, to);
		cb(conversation);
	});
	socket.on('fetchUserConverstaions', async ({ userId }, cb) => {
		let conversation = await getUserConversations(userId);
		cb(conversation);
	});
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});

const port = 3001;
http.listen(port, () =>
	console.log(` app listening at http://localhost:${port}`)
);
