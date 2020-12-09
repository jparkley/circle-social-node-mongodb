

const User = require('../models/User');

exports.mustBeLoggedIn = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform the action.");
    req.session.save(function() {
      res.redirect('/');
    })
  }
}

exports.register = function(req, res) {
  let user = new User(req.body);

  user.register().then(() => {
    req.session.user = {username: user.data.username, avatar:user.avatar, _id:user.data._id};
    req.session.save(function() {
      res.redirect('/')
    });
  }).catch((regErrors) => {
    req.flash('regErrors', regErrors);
    req.session.save(function() {
      res.redirect('/');
    });
  });
}

exports.login = function(req, res) {
  let user = new User(req.body);

  // user.login(function(result) {
  //   res.send(result);
  // }); // -> using traditional callback function

  user.login().then(function(result) {
    console.log("in login: ", user.data._id);
    req.session.user = {username: user.data.username, avatar:user.avatar, _id:user.data._id};
    req.session.save(function() { // Manually call "save" to use callback function (for async DB work)
        res.redirect('/');
    });
  }).catch(function(err) {
    req.flash('errors', err); // Add error message to the session (req.session.flash.errors = [err];)
    req.session.save(function() {
      res.redirect('/');
    });
  });
}

exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
}


exports.displayHome = function(req, res) {
  if (req.session.user) {
    res.render('home-dashboard');
  } else {
    // Access err msg & save it to the new object and delete the msg from session, hence flash
    res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')});
  }
}
