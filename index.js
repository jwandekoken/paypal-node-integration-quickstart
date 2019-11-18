// https://www.npmjs.com/package/dotenv
require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const paypalController = require('./controllers/paypalController');
const homeController = require('./controllers/homeController');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

// home
app.get("/", homeController.getHome);

// paypal routes
app.post("/create-payment", paypalController.postCreatePayment);

app.get("/payment-callback", paypalController.paymentCallback);

app.get("/payment-cancel-success", (req, res, next) => {
  res.status(500).send('payment cancel callback');
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.HOST}:${process.env.PORT}`);
});
