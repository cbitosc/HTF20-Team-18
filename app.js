const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const BodyParser = require("body-parser");
const Bcrypt = require("bcryptjs");
dotenv.config();
var multer = require('multer');
var upload = multer(); 
var http = require('http');
const socketio = require('socket.io');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var myPythonScriptPath = 'books.py';
var myPythonScriptPath1 = 'movies.py';
var myPythonScriptPath2 = 'tvshows.py';
const {PythonShell} = require("python-shell");
var pyshell = new PythonShell(myPythonScriptPath);
var pyshell2 = new PythonShell(myPythonScriptPath1);
var pyshell3 = new PythonShell(myPythonScriptPath2);

//var PythonShell = require ('python-shell');




const app = express();

const server = http.createServer(app);
const io = socketio(server);

const formatMessage = require('./utils/messages');

const mongoose = require('mongoose');
app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extend: true }));
// app.use(express.static('/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({secret: "Shh, its a secret!"}));
app.use(upload.array());

const user = require('./models/user');




const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DB_CONNECT, {
  useNewUrlParser: true
}, () => {
  console.log("db connection established");
  app.listen(PORT, () => {
      console.log(`Listening on port: ${PORT}`);
  });
});

//server.listen(PORT, () => console.log('Server running on port ${PORT}'));


const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/users');

// const server = http.createServer(app);
// const io = socketio(server);

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

    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} has left the chat`)
        );
  

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });


      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});






app.get('/', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

app.get('/movies', (req, res) => {
  res.render('movies.ejs');
});

app.get('/book', (req, res) => {
  res.render('books.ejs');
});

app.get('/chat', (req, res) => {
  res.render('chat.ejs');
});

app.get('/forum', (req, res) => {
  res.render('forum.ejs');
});

app.get('/tvshows', (req, res) => {
  res.render('TV_shows.ejs');
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

app.post('/books', function (req, res) {
      // If it's not showing up, just use req.body to see what is actually being passed.
      var result = req.body.books;
      console.log(req.body.books);

      pyshell.send(JSON.stringify(result));


      pyshell.on('message', function(message){
        console.log(message);
      })
      
      pyshell.end(function (err) {
        if (err){
           // throw err;
           console.log(err.toString());
        };
      
        console.log('finished');
      });
      var options = {
        mode: 'text',
        pythonPath: 'path/to/python',
        pythonOptions: ['-u'],
        scriptPath: 'path/to/my/scripts',
        //args: ['value1', 'value2', 'value3']
        args: [results]
    };

      PythonShell.run('books.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results: %j', results);
    });

  });


  app.post('/movies', function (req, res) {
    // If it's not showing up, just use req.body to see what is actually being passed.
    var result = req.body.Movies;
    console.log(req.body.Movies);

    pyshell2.send(JSON.stringify(result));


    pyshell2.on('message', function(message){
      console.log(message);
    })
    
    pyshell2.end(function (err) {
      if (err){
         // throw err;
         console.log(err.toString());
      };
    
      console.log('finished');
    });
    var options = {
      mode: 'text',
      pythonPath: 'path/to/python',
      pythonOptions: ['-u'],
      scriptPath: 'path/to/my/scripts',
      //args: ['value1', 'value2', 'value3']
      args: [results]
  };

    PythonShell.run('tvshows.py', options, function (err, results) {
      if (err) throw err;
      // results is an array consisting of messages collected during execution
      console.log('results: %j', results);
  });

});

app.post('/tvshows', function (req, res) {
  // If it's not showing up, just use req.body to see what is actually being passed.
  var result = req.body.TV_Shows;
  console.log(req.body.TV_Shows);

  pyshell3.send(JSON.stringify(result));


  pyshell3.on('message', function(message){
    console.log(message);
  })
  
  pyshell3.end(function (err) {
    if (err){
       // throw err;
       console.log(err.toString());
    };
    
    console.log('finished');
  });

  var options = {
    mode: 'text',
    pythonPath: 'path/to/python',
    pythonOptions: ['-u'],
    scriptPath: 'path/to/my/scripts',
    //args: ['value1', 'value2', 'value3']
    args: [results]
};

  PythonShell.run('script.py', options, function (err, results) {
    if (err) throw err;
    // results is an array consisting of messages collected during execution
    console.log('results: %j', results);
});

});

