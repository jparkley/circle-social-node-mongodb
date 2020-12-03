const User = require('../models/User');


exports.displayHome = function(req, res) {
  res.render('home-guest');
}

exports.register = function(req, res) {
  let user = new User(req.data);
  user.register();
  res.send("Thank you for regisering.");
}
