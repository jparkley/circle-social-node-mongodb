
const mongodb = require('mongodb');
const dotenv = require('dotenv');



dotenv.config();

const connectionString = process.env.CONNECTIONSTRING;
mongodb.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
  module.exports = client;
  //console.log(err);

  // Only when the db connection is successful
  const app = require('./app');
  app.listen(process.env.PORT);
});

// 
// const mongoose = require('mongoose')
// mongoose.connect("mongodb://localhost:27017/circleDB", { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
//   module.exports = client;
//   const app = require('./app')
//   app.listen(process.env.PORT)
// });
