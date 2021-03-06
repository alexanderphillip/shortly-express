var express = require('express');
var session = require('express-session')
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var passport = require('passport')

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var fbauth = require("./app/fbauth.js");


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/', function(req, res) {
  console.log("GET /");
  if (util.checkToken(req, res)) {
    res.render('index');
  } else {
    res.writeHead(303, {location: "/login"});
    res.end();
  }
});

app.get('/create',
function(req, res) {
  console.log("GET /create");
  if (util.checkToken(req, res)) {
    res.render('index');
  } else {
    res.writeHead(303, {location: "/login"});
    res.end();
  }
});

app.get('/links', function(req, res) {
  if (util.checkToken(req, res)) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  } else {
    res.writeHead(303, {location: "/login"});
    res.end();
  }
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/logout', function(req, res) {
  req.session.token = undefined
  req.logout();
  res.render("login");
});

app.get('/login', function(req, res) {
  console.log("GET /login");
  res.render('login');
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(fetchedUser) {
    if (fetchedUser) {

      var testUser = new User({username: username, password: password});
      testUser.doHashPassword(fetchedUser.get('salt'));

      if (fetchedUser.get('password') == testUser.get('password')) {
        req.session.token = username;
        res.writeHead(303, {location: "/"});
        res.end();

      } else {
        res.render('loginError');
      }

      // res.writeHead(303, {location: "/login"});
      // res.end();

    } else {
      //res.writeHead(303, {location: "/signup"});
      res.writeHead(303, {location: "/login"});
      res.end();
    }
  });
});


app.get('/signup',
function(req, res) {
  console.log("GET /signup");
  res.render('signup');
});


app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      res.writeHead(303, {location: "/login"});
      res.end();
    } else {

      var user = new User({
        username: username,
        password: password,
      });

      user.save().then(function(user) {
        // Users.add(user);
        res.writeHead(303, {location: "/"});
        res.end();
      });
    }
  });
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
