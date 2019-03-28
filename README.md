# weatherBot
A Slack bot to get the weather by city name

### Usage
  - Usage is simple, within the slack org type ```/weather``` followed by the name of a city. And weatherBot will take care of the rest

### Notes
  - According to the openweathermap api when making a query with a city name, if there is more than one city with that name then an array of cities would be returned in the response. In reality this doesn't happen (I'm assuming because I'm using the free tier), as a result I needed a list of cities so I added their city.list.json file to this project.

  - I also used both old and new ways to style my message content (attachments and blocks, respectively). I ended up having some issues with the newer blocks style for the drop down list, so in the interest of time I went ahead and used the older method.
