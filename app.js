// app.js
const express = require('express');
const bodyParser = require('body-parser');
// var multer = require('multer');
const cors = require('cors');
let path = require('path');

// initialize our express app
const app = express();

// Set up mongoose connection
const mongoose = require('mongoose');
let dev_db_url = 'mongodb://Trex_son:Salvat1on1987@ds243254.mlab.com:43254/photoalbumdb';//change to mfmdb
let mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });//mongoose.set('useFindAndModify', false);

mongoose.Promise = global.Promise;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
module.exports = db;
module.exports = mongoose;

app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});

//import routes
const indexRoute = require('./routes/index.route');
const userRoute = require('./routes/user.route');

app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'views')));
// app.set('assets', path.join(__dirname, 'assets'));
// app.set('node_modules', path.join(__dirname, 'node_modules'));
// app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use('/', indexRoute);
app.use('/user', userRoute);

console.log(path.join(__dirname, 'views'));

//handle 400
app.use((req, res)=> {
    res.status(400);
    // res.sendFile(path.resolve('./Views', 'not-found.html'));
});

//handlle 500
app.use((error, req, res, next)=> {
    res.status(500);
    // res.sendFile(path.resolve('./Views', 'error-not-found.html'));
});


const port = process.env.PORT || 2020;
app.listen(port, () => {
    console.log('Server is up and running on port number ' + port);
});