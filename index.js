const express = require('express');
const app = express();
 
app.get('/', function (req, res) {
  res.send('Hello World');
})
 
app.listen(process.env.PORT || 3000);