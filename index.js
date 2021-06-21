require("dotenv").config();
const express = require('express');
const app = express();

app.use(express.static("./public"));
app.use(express.json());

let port = process.env.PORT || 1337;

require('./middlewares/routes.mdw')(app);

app.listen(port, ()=>{
   console.log(`webhook is listening at port ${port}`) ;
});