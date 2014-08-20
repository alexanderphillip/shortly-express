
var User = require('./models/user.js');
var FbUser = require('./models/fbuser.js');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;


passport.use(new FacebookStrategy({
    clientID: '683962965019391',
    clientSecret: 'b888da636fc804ef5db56d1a2e423b5b',
    callbackURL: "http://localhost:4568/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log("profile: " , profile);
    new FbUser({fbId : profile.id}).fetch().then(function(oldUser) {
      console.log("oldUser: ", oldUser);
      if(oldUser){
        done(null,oldUser);
      }else{
        console.log("saving new user: ", profile.id);
        var newUser = new FbUser({
          fbId : profile.id
        }).save().then(function(newUser){
          done(null, newUser);
        });
      }
    });
  }
  ));

passport.serializeUser(function(user, done) {
  console.log("serializing user: ", user.attributes.fbId);
  done(null, user.attributes.fbId);
});

passport.deserializeUser(function(id, done) {
  console.log("deserializing user: ", id);
  new FbUser({fbId: id}).fetch().then(function(user){

    console.log("searched for fb user in deserialization: ", user.attributes.fbId);
    if(user){

      console.log("found fb user in db");
      done(null,user);

    }else{

      console.log("fbuser not found in db:", id);
      new User({id: id}).fetch().then(function(user){
        done(null,user);
      });
    }
  });
});
