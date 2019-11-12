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

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  // console.log(req.body.params);
  axios
    .get(`https://api.ipdata.co/?api-key=${apiKeyIp}`)
    .then(response => {
      res.status(200).send(response.data);
    })
    .catch(err => {
      console.log(err);
    });
});

app.post("/getAirport", (req, res) => {
  // console.log(req.body.data);
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
      console.log(response.data);
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
  console.log(req.body.data);
  
  
  function handleResponse(response) {
    console.log(response.data.Status);
    
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
            console.log("inside then");
            handleResponse(response);
          })
          .catch(err => {
            console.log(err);
          });
      }, 1500);
    } else {
      console.log("ended res");
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
      console.log(response);
      let index = response.headers.location.lastIndexOf("/");
      console.log(index);
      let sessionKey = response.headers.location.slice(index + 1);
      console.log(sessionKey);

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
          // console.log(response);
          // res.status(200).write(response.data);
          return response;
        })
        .catch(error => {
          console.log(error);
        });
    })
    .catch(error => {
      console.log(error);
    });
});

app.get("/currencies", (req, res) => {
  // console.log(req.body.params);
  axios({
    method: "GET",
    url:
      "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/reference/v1.0/currencies",
    headers: {
      "content-type": "application/octet-stream",
      "x-rapidapi-host":
        "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
      "x-rapidapi-key": "6197cfc0d0msh9622056db966a97p1866fbjsn3d63183b204d"
    }
  })
    .then(response => {
      // console.log(response)
      res.status(200).send(response.data);
    })
    .catch(error => {
      console.log(error);
    });
});

app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
