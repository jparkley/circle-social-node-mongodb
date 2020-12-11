const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const app = express();
const sanitizeHTML = require('sanitize-html');

let sessionWithOptions = session({
  secret: "charter school for enriched studies",
  store: new MongoStore({client: require('./db')}),
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true} // one day
});

app.use(sessionWithOptions);
app.use(flash());

//*** This function will run for every request ***//
app.use(function(req, res, next) {
  // Make markdown function available within ejs templates
  res.locals.filterUserHTML = function(content) {
    return sanitizeHTML(markdown(content), {
      allowedTags:['p','br','ul','ol','em','i','strong','bold','h1','h2','h3','h4','h5','h6'],
      allowedAttributes:{}});
  }
  // Make current user id available on the req object as "visitor id"
  if (req.session.user) { req.visitorId = req.session.user._id } else { req.visitorId = 0}
  res.locals.user = req.session.user; // With this, user info is available within EJS templates
  // Make all error and success flash message available from all templates
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');
  next();
});

const router = require('./router');

/* Add user submitted data to the request object (from HTTP form & JSON data) */
app.use(express.urlencoded({extended: false}));
app.use(express.json());

/* View engine Configuation */
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use('/', router);

//app.listen(3000);
module.exports = app; // exports to db.js
