const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const app = express();

let sessionWithOptions = session({
  secret: "charter school for enriched studies",
  store: new MongoStore({client: require('./db')}),
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true} // one day
});

app.use(sessionWithOptions);
app.use(flash());

app.use(function(req, res, next) {
  res.locals.user = req.session.user; // With this, user info is available within EJS templates  
  res.locals.errors = req.flash('errors');
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
