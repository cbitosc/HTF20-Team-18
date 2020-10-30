const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const BodyParser = require("body-parser");
const Bcrypt = require("bcryptjs");
dotenv.config();
const app = express();
const mongoose = require('mongoose');
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extend: true }));
app.use(express.static('/public'));


const user = require('./models/user')


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

/*app.post("/login", (req,res)=>{
    user.findOne({email:req.body.emailid, password:req.body.password}, function(err,usr)
    {
        if(err|| !usr)
        {
        console.log("User not found/registered")
        res.render('signup.ejs');
        }
        else{
        console.log("logged in");
        }
       // render notes main page 
    }
)}); */

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
            res.redirect('/mainpage'); // redirect to notes mainpg
        } catch (err) {
            console.log(err);
            res.redirect('/signup') // or signup
        }
    });




app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});


app.get('/mainpage', (req,res)=>{
    res.render('mainpage.ejs');
});


/*
--------------------------------
            USE THIS GET METHOD TO TEST THE SIGN UP METHODS
--------------------------------
            ↓↓↓↓↓↓↓↓↓↓↓↓↓↓
*/



app.get('/test',(req, res)=>{
    note.find({}, (err, note) => {
        console.log(note);
        res.send(note);
    })
})




// app.get('/test',(req, res)=>{
//     user.find({}, (err, user) => {
//         console.log(user);
//         res.send(user);
//     })
// })




/*app.post('/signup',(req,res)=>{
    res.render('loginsuccessful.ejs');
});*/
