const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const BodyParser = require("body-parser");
const Bcrypt = require("bcryptjs");
dotenv.config();
var multer = require('multer');
var upload = multer(); 

var cookieParser = require('cookie-parser');
var session = require('express-session');

const app = express();
const mongoose = require('mongoose');
app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extend: true }));
app.use(express.static('/public'));
app.use(cookieParser());
app.use(session({secret: "Shh, its a secret!"}));
app.use(upload.array());

const user = require('./models/user');

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/users');

const server = http.createServer(app);
const io = socketio(server);

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});



// const rooms = { };

// app.get('/forum', (req, res) => {
//     res.render('forum.ejs', { rooms: rooms })
//   })
  
//   app.post('/room', (req, res) => {
//     if (rooms[req.body.room] != null) {
//       return res.redirect('/')
//     }
//     rooms[req.body.room] = { users: {} }
//     res.redirect(req.body.room)
//     // Send message that new room was created
//     io.emit('room-created', req.body.room)
//   })
  
//   app.get('/:room', (req, res) => {
//     if (rooms[req.params.room] == null) {
//       return res.redirect('/')
//     }
//     res.render('room', { roomName: req.params.room })
//   })
  
// //server.listen(3000)
  
//   io.on('connection', socket => {
//     socket.on('new-user', (room, name) => {
//       socket.join(room)
//       rooms[room].users[socket.id] = name
//       socket.to(room).broadcast.emit('user-connected', name)
//     })
//     socket.on('send-chat-message', (room, message) => {
//       socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
//     })
//     socket.on('disconnect', () => {
//       getUserRooms(socket).forEach(room => {
//         socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
//         delete rooms[room].users[socket.id]
//       })
//     })
//   })
  
//   function getUserRooms(socket) {
//     return Object.entries(rooms).reduce((names, [name, room]) => {
//       if (room.users[socket.id] != null) names.push(name)
//       return names
//     }, [])
//   }


mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true
}, () => {
    console.log("db connection established");
    app.listen(PORT, () => {
        console.log(`Listening on port: ${PORT}`);
    });
});



const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});



app.post("/login", async (request, response) => {
    try {
        var usr = await user.findOne({ email: request.body.emailid }).exec();
        if(!usr) {
            console.log("user not found/registered");
            //return response.status(400).send({ message: "The username does not exist" });
            response.render('signup.ejs');
        }
        if(!Bcrypt.compareSync(request.body.password, usr.password)) {
           //return response.status(400).send({ message: "The password is invalid" });
           console.log("invalid password");
           response.redirect('/login');
        }
       // response.send({ message: "The username and password combination is correct!" });
        else
            {console.log('yay');
            //req.session.user = usr;
            response.render('mainpage.ejs');}
    } catch (error) {
        response.status(500).send(error);
    }
});





app.route('/signup')
    .get((req, res) => {
        res.render('signup.ejs');
    })
    .post(async (req, res) => {
        req.body.password = Bcrypt.hashSync(req.body.password, 10);
        const User = new user({
            email: req.body.email,
            password: req.body.password
        });
        console.log(req.body)
        try {
            await User.save();
            //req.session.user = User;
            res.redirect('/mainpage'); // redirect to notes mainpg
        } catch (err) {
            console.log(err);
            res.redirect('/signup') // or signup
        }
    });

    // function checkSignIn(req, res){
    //     if(req.session.user){
    //       res.redirect('/mainpage');  //If session exists, proceed to page
    //     } else {
    //         res.redirect('/'); 
    //     //    var err = new Error("Not logged in!");
    //     //    console.log(req.session.user);
    //     //    console.log(err);  //Error, trying to access unauthorized page!
    //     }
    //  }


app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});


// app.get('/mainpage', (req,res)=>{
//     res.render('mainpage.ejs',{id: req.session.user.id});
// });


app.get('/mainpage',  function(req, res){
    res.render('mainpage.ejs');
 });


 app.use('/protected_page', function(err, req, res, next){
    console.log(err);
       //User should be authenticated! Redirect him to log in.
       res.redirect('/login');
    });

app.get('/logout', function(req, res){
        req.session.destroy(function(){
           console.log("user logged out.")
        });
        res.redirect('/');
     });
