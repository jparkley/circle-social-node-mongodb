const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const csrf = require('csurf')
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

// Set to use a CSRF token for post,delete,put or any requests that modify state
app.use(csrf())

app.use(function(req, res, next) {
  //*** res.locals.csrfToken: this will contain the tocken value to output into the HTML templates
  //*** req.carfToken: this function (from the package) will generate a token
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use('/', router);

app.use(function(err, req, res, next) {
  if (err) {
    if (err.code == "EBADCSRFTOKEN") {
        req.flash('errors', "Cross site request forgery detected." );
        req.session.save(() => res.redirect('/'))
    } else {
      res.render("404")
    }
  }
})

//*** Create a server that is going to use our Express app as its handler (20201218)
const server = require('http').createServer(app)

//*** Add socket functionality to the server
const io = require('socket.io')(server)

io.use(function(socket, next) { // This function will run anytime there is a new transfer of data
  sessionWithOptions(socket.request, socket.request.res, next) // Express session data will be available within the context of socket.io
})

// Listen "on" the connection
io.on('connection', function(socket) {
  // Acknowledge a chat msg being sent from a browser is if it's coming from a browser with looged in user session data
  if (socket.request.session.user) {
    let user = socket.request.session.user
    socket.emit('welcome', {username: user.username, avatar: user.avatar})
    //socket.on ('event type', function that will run in response)
    socket.on('chatMessageFromBrowser', function (data) {
      // io.emit : to everyone
      // socket.broadcast.emit: to everyone except the one who sent the msg
      socket.broadcast.emit('chatMessageFromServer', {
        message: sanitizeHTML(data.message, {allowedTags:[], allowedAttributes: {}}),
        username: user.username,
        avatar: user.avatar})
    })

  }
})

//app.listen(3000);
//module.exports = app; // exports to db.js
module.exports = server; // exports to db.js
