const express = require('express');
const app = express();
const router = require('./router');

/* Add user submitted data to the request object (from HTTP form & JSON data) */
app.use(express.urlencoded({extended: false}));
app.use(express.json());

/* View engine Configuation */
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use('/', router);


app.listen(3000);
