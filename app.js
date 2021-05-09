//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');


const app  = express();


const url = "mongodb://localhost:27017/userDB";
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});


const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/",function(req,res){
  res.render('home');
});

app.route("/register")

  .get(function(req,res){
    res.render('register');
  })

  .post(function(req,res){

    const newUser = new User({
      email: req.body.username,
      password: req.body.password
    });

    newUser.save(function(err){
      if(err) console.log(err);
      else res.render("login");
    });
  });

app.route("/login")

  .get((req,res)=>{
    res.render('login');
  })

  .post((req,res)=>{


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

    User.findOne(
      {email: req.body.username},
      function(err,foundUser){
        if(err) console.log(err);
        else{
          if(foundUser){
            if(foundUser.password === req.body.password){
              res.render("secrets");
            }
          }
        }
      }
    );

  });

app.get("/submit",function(req,res){
  res.render('submit');
});



app.listen("3000",function(){
  console.log("Server Successfully connected");
});
