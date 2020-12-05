

const User = require('../models/User');

exports.register = function(req, res) {
  let user = new User(req.body);
  user.register();

  if (user.errors.length > 0) {
    res.send(user.errors)
  } else {
    res.send("Thank you for registering.");
  }
}

exports.login = function(req, res) {
  let user = new User(req.body);

  // user.login(function(result) {
  //   res.send(result);
  // }); // -> using traditional callback function

  user.login().then(function(result) {
    req.session.user = {fav:"galaxy", username: user.data.username};
    res.send(result);
  }).catch(function(err) {
    res.send(err);
  });
}

exports.displayHome = function(req, res) {
  if (req.session.user) {
    res.render('home-dashboard', {username: req.session.user.username});
  } else {
    res.render('home-guest');
  }
}
