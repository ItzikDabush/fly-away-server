const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

var querystring = require("querystring");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

const apiKeyIp = process.env.IP_API_KEY;
const RapidapiKey = process.env.X_RAPIDAPI_KEY;

// app.options("*", cors());
app.use(cors());
app.use(bodyParser.json());



app.use(cors({
  origin: 'https://fly-away-itzik.herokuapp.com',
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options('*', cors())


app.all('', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://fly-away-itzik.herokuapp.com");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  //Auth Each API Request created by user.
  next();
});



app.post("/getAirport", (req, res) => {
  const { originByIP } = req.body.data;
  axios({
    method: "GET",
    url:
      "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/autosuggest/v1.0/UK/GBP/en-GB/",
    headers: {
      "content-type": "application/octet-stream",
      "x-rapidapi-host":
        "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
      "x-rapidapi-key": `${RapidapiKey}`
    },
    params: {
      query: originByIP
    }
  })
    .then(response => {
      res.status(200).send(response.data);
    })

    .catch(error => {
      console.log(error);
    });
});

app.post("/data", (req, res) => {
  const {
    country,
    currency,
    locale,
    originPlace,
    destinationPlace,
    outboundDate,
    adults,
    inboundDate,
    children,
    infants,
    stops
  } = req.body.data;

  function handleResponse(response) {
    if (response.data.Status === "UpdatesPending") {
      return setTimeout(() => {
        axios({
          method: "GET",
          url: `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/uk2/v1.0/${response.data.SessionKey}`,
          headers: {
            "content-type": "application/octet-stream",
            "x-rapidapi-host":
              "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            "x-rapidapi-key": `${RapidapiKey}`
          },
          params: {
            pageIndex: "0",
            pageSize: "50",
            sortType: "price",
            sortOrder: "asc",
            stops
          }
        })
          .then(response => {
            handleResponse(response);
          })
          .catch(err => {
            console.log(err);
          });
      }, 1500);
    } else {
      return res.status(200).send(response.data);
    }
  }

  //Creating a session with Skyscanner. A successful response contains no content. The session key to poll the results is provided in the Location header of the response. The last value of location header contains the session key which is required when polling the session.
  axios({
    method: "POST",
    url:
      "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/v1.0",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-rapidapi-host":
        "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
      "x-rapidapi-key": `${RapidapiKey}`
    },
    data: querystring.stringify({
      //sitePrefernces
      country: country,
      currency: currency,
      locale: locale,
      //tripToSearch - required to open session
      originPlace: originPlace,
      destinationPlace: destinationPlace,
      outboundDate: outboundDate,
      adults: adults,
      //tripToSearch - optinal to open session

      inboundDate: inboundDate,
      children: children,
      infants: infants
    })
  })
    .then(response => {
      let index = response.headers.location.lastIndexOf("/");
      let sessionKey = response.headers.location.slice(index + 1);
      return sessionKey;
    })

    //Get itineraries from a created session

    .then(sessionKey => {
      axios({
        method: "GET",
        url: `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/uk2/v1.0/${sessionKey}`,
        headers: {
          "content-type": "application/octet-stream",
          "x-rapidapi-host":
            "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
          "x-rapidapi-key": `${RapidapiKey}`
        },
        params: {
          pageIndex: "0",
          pageSize: "50",
          sortType: "price",
          sortOrder: "asc",
          stops
        }
      })
        .then(response => {
          handleResponse(response);
          return response;
        })
        .catch(error => {
          console.log(error);
        });
    })
    .catch(error => {
      console.log(error);
      res.status(400).send(error);
    });
});

app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
