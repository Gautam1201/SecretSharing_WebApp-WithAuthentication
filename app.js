//jshint esversion:6

require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app  = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

const url = "mongodb://localhost:27017/userDB";
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",function(req,res){
  res.render('home');
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()) res.render("secrets");
  else res.redirect("/login");
});

app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect("/");
});

app.route("/register")

  .get(function(req,res){
    res.render('register');
  })

  .post(function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
      if(err){
        console.log(err);
        res.redirect("/register");
      }else{
        passport.authenticate("local")(req, res, function(err, user){
          res.redirect("/secrets");
        });
      }
    });
  });


app.route("/login")

  .get((req,res)=>{
    res.render('login');
  })

  .post((req,res)=>{

    const user = new User({
      username : req.body.username,
      password : req.body.password
    });

    req.login(user, function(err){
      if(err) console.log(err);
      else {
          passport.authenticate("local")(req,res,()=>{
            res.redirect("/secrets");
          });
      }
    });

  //My method,does not work as my password is encrypted, hence condition fails.
    // User.findOne(
    //   {
    //     email: req.body.username,
    //     password: req.body.password
    //   },
    //   function(err,foundUser){
    //     if(!err){
    //       if(foundUser) res.render("secrets");
    //       else res.render("login");
    //     }else
    //     console.log(err);
    //   }
    // );

  });

app.get("/submit",function(req,res){
  res.render('submit');
});



app.listen("3000",function(){
  console.log("Server Successfully connected");
});
