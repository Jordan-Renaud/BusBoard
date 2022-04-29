import fetch from "node-fetch";
import readLine from "readline";

const stopID = "490008660N";

async function getBusInfoFor(stopID) {
  const url = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`;
  const response = await fetch(url);
  const busInfo = await response.json();

  return busInfo;
}

function logBusArrivalTimes(busInfo) {
  arrivals.sort((a, b) => a.timeToStation - b.timeToStation);

  arrivals.forEach((busArrival) => {
    const minutesUntilBusArrives = Math.floor(busArrival.timeToStation / 60);

    if (minutesUntilBusArrives === 0) {
      console.log(`Bus to ${busArrival.destinationName} is due.`);
    } else {
      console.log(
        `Bus to ${busArrival.destinationName} arriving in ${minutesUntilBusArrives} minutes.`
      );
    }
  });
}

async function getPostcodeData(postcode) {
  const urlForPostCodeRequest = `https://api.postcodes.io/postcodes/${postcode}`;
  const postcodeJSON = await fetch(urlForPostCodeRequest);
  return postcodeJSON.json();
}

async function getCloseStopIDS(coords) {
  const lon = coords.longitude;
  const lat = coords.latitude;
  const stopsIdAPI = await fetch(
    `https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=500`
  );
  return stopsIdAPI.json();
}

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("What is your postcode? ", async (answer) => {
  //TODO: potentially do some error handling here
  const postcode = answer.toLocaleUpperCase().trim();
  const postcodeData = await getPostcodeData(postcode);

  const postcodeLocation = {
    longitude: postcodeData.result.longitude,
    latitude: postcodeData.result.latitude,
  };

  const stopIDS = await getCloseStopIDS(postcodeLocation);

  console.log(stopIDS);
  rl.close();
});

//get users input for postcode
//remove any spaces + captilise it
//get long and lat

//url = api.postcodes.io/postcodes/{postcode}
//validate => if status 404 then inform user
//retrieve longitude + latitude
//coords for testing = lat = 51.55411 long = -0.292968
// url for bus stops within long + lat = https://api.tfl.gov.uk/StopPoint/?lat={lat}&lon={lon}&stopTypes={stopTypes}[&radius]
//stop typpes = look for NaptanId watch for children (stop on either side of the road)
