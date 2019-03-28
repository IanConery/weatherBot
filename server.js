require('dotenv').config();
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

const { getWeather, getWeatherById } = require('./controllers/weatherController.js');

const app = express();
const port = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/slack/command/weather', getWeather);

app.post('/slack/actions', getWeatherById);

app.listen(port, () => {
  console.log(`Connection succesfull\nServer listening on port ${port}`);
});