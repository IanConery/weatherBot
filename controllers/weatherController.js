const axios = require('axios');
const { readFileSync } = require('fs');

const baseUrl = 'http://api.openweathermap.org';
const weatherUrl = `${baseUrl}/data/2.5/weather`;
const iconUrl = `${baseUrl}/img/w/`;
const keyString = `&APPID=${process.env.OPEN_WEATHER_API_KEY}`;

const findCity = (cityName) => {
  const cityList = JSON.parse(readFileSync('./city.list.json'));
  return cityList.filter((city) => city.name.toLowerCase() === cityName.toLowerCase());
};

// please don't judge me on this, I built it this way in the intrest of time
// I'm sure there is a more succinct way to do this
const findWindDirection = (deg) => {
  let result;
  if (deg >= 338 || deg <= 22) {
    result = 'north';
  } else if (deg >= 23 && deg <= 68) {
    result = 'north east';
  } else if (deg >=69 && deg <= 112) {
    result = 'east';
  } else if (deg >= 113 && deg <= 158) {
    result = 'south east';
  } else if (deg >= 158 && deg <= 202) {
    result = 'south';
  } else if (deg >= 203 && deg <= 248) {
    result = 'south west';
  } else if (deg >= 249 && deg <= 292) {
    result = 'west';
  } else {
    reuslt = 'north west';
  }
  return result;
};

// I'm trying to use the new blocks part of the slack api
// however I'm getting an invalid blocks message even though when I put the
// following block in their 'block editor' it displays fine ¯\(°_o)/¯
const buildCityOptionList = (cityList, cityName) => {
  const formattedCityList = cityList.map(({ name, country, id }) => {
    return {
      text: {
        type: 'plain_text',
        text: `${name}, ${country}`
      },
      value: id
    };
  });

  return [{
    type: 'section',
    text: {
      type: 'plain_text',
      text: `I appears there is more than one ${cityName}. Please choose your city from the list.`
    },
    accessory: {
      action_id: 'weather_location',
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: 'Please choose a city...'
      },
      options: formattedCityList
    }
  }];
};

const requestWeather = async (cityId) => {
  return await axios.get(`${weatherUrl}?id=${cityId}${keyString}&units=imperial`);
};

const getFormattedResponse = async (cityId, userName) => {
  const {
    data: {
      name,
      weather,
      main: { temp, humidity },
      wind: { deg, speed: windSpeed },
      sys: { country }
    }
  } = await requestWeather(cityId);

  const { main, description, icon } = weather[0];
  const windDirection = findWindDirection(parseInt(deg, 10));
  const image_url = `${iconUrl}${icon}`;

  return [{
    type: 'section',
    text: {
      type: 'plain_text',
      text: `Hi ${userName} :wave:,\nCurrently in ${name}, ${country} you can expect:`
    },
    fields: [
      {
        type: 'plain_text',
        text: `${Math.round(temp)} degrees fahrenheit`
      },
      {
        type: 'plain_text',
        text: `${description}`
      },
      {
        type: 'plain_text',
        text: `${humidity}% humidity`
      },
      {
        type: 'plain_text',
        text: `${Math.round(windSpeed)}mph winds${windDirection ? ` from the ${windDirection}` : ''}`
      }
    ],
    accessory: {
      image_url,
      type: 'image',
      alt_text: `${main} ${icon[icon.length - 1] === 'd' ? 'day' : 'night'}`
    }
  }];
};

exports.getWeather = async (req, res) => {
  const { channel_id, text, user_name } = req.body;
  const cityList = findCity(text);

  const response = {
    response_type: 'in_channel',
    channel: channel_id,
    text: ''
  };

  const nestedResponse = [{
    text: `I appears there is more than one ${text}. Please choose your city from the list.`,
    fallback: `I appears there is more than one ${text}. Please choose your city from the list.`,
    color: '#2e963f',
    attachment_type: 'default',
    callback_id: 'weather_location',
    actions: [{
      name: 'city_select_menu',
      text: 'Please choose a city...',
      type: 'select',
      options: cityList.map(({ name, country, id }) => {
        return { text: `${name}, ${country}`, value: id };
      })
    }]
  }];

  try {
    if (cityList.length === 0) {
      response.text = `Sorry, I can't seem to find a city named ${text}`;
    } else if (cityList.length > 1) {
      // response.blocks = buildCityOptionList(cityList, text);
      response.attachments = nestedResponse;
    } else {
      const { id } = cityList[0];
      response.blocks = await getFormattedResponse(id, user_name);
    }
    res.status(200).json(response);
  } catch(error) {
    console.error(error);
    res.status(500).send(error);
  }
};

exports.getWeatherById = async (req, res) => {
  const {
    callback_id,
    actions,
    user: { name },
    channel: { id: channelId }
  } = JSON.parse(req.body.payload);

  const response = {
    response_type: 'in_channel',
    channel: channelId,
    text: ''
  };

  try {
    if (callback_id === 'weather_location') {
      const id = actions[0].selected_options[0].value;
      response.blocks = await getFormattedResponse(id, name);
    } else {
      throw new Error(`Unexpected callback_id: ${callback_id}`);
    }
    res.status(200).json(response);
  } catch(error) {
    console.error(error);
    res.status(500).send(error);
  }
};