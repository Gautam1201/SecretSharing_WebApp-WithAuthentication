//jshint esversion:6

require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render('home');
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/auth/facebook",
  passport.authenticate("facebook")
);

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


app.get("/secrets",function(req,res){
  User.find({"secret": {$ne: null}}, function(err,foundUsers){
    if(err) console.log(err);
    else{
      res.render("secrets",{secretsTold: foundUsers});
    }
  });
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
  if(req.isAuthenticated()) res.render("submit");
  else res.redirect("login");
});

app.post("/submit",function(req,res){
  const posted_secret = req.body.secret;
  console.log(req.user);
  User.findById( req.user.id ,function(err, foundUser){
    if(err) console.log(err);
    else{
      if(foundUser){
         foundUser.secret = posted_secret;
         foundUser.save(function(){
           res.redirect("/secrets");
         });
      }
    }
  });
});



app.listen("3000",function(){
  console.log("Server Successfully connected");
});
