import fetch from "node-fetch";
import promptFn from "prompt-sync";
import winston from "winston";

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const prompt = promptFn();
const postcodeCoords = await getAndSetPostcodeCoords();
const closeStopIDs = await getAndSetCloseStopIDsFor(postcodeCoords);

closeStopIDs.forEach((stopID) => {
  getAndLogBusInfoFor(stopID.id);
});

async function getAndSetPostcodeCoords() {
  let postcodeJSON;
  let isValidPostcode = false;

  while (!isValidPostcode) {
    let postcodeResponse;
    const postcode = prompt("Please input a London postcode: ");

    try {
      const url = `https://api.postcodes.io/postcodes/${postcode}`;
      postcodeResponse = await fetch(url);
    } catch (error) {
      logger.error(
        `Fetch failed attempting to access https://api.postcodes.io/postcodes/${postcode}`
      );
      console.log(
        "Sorry, there seems to be an issue with internet connectivity"
      );
      //TODO: winston
      throw error;
    }

    try {
      postcodeJSON = await postcodeResponse.json();
      if (postcodeJSON.status === 404) {
        throw new Error(`Postcode ${postcode} is not valid`);
      }
    } catch (error) {
      logger.error(`Postcode provided not valid. Postcode: ${postcode}`);
      console.log(`Postcode '${postcode}' is not valid. Please try again.`);
      continue;
    }

    try {
      if (postcodeJSON.result.region !== "London") {
        throw new Error(`Postcode ${postcode} is a London postcode`);
      }
    } catch (error) {
      logger.error(
        `User inputed a non London postcode. Postcode provided: ${postcode}`
      );
      console.log(
        `Postcode '${postcode}' is not a London postcode. Please try again.`
      );
      continue;
    }
    isValidPostcode = true;
  }

  return getCoordsFrom(postcodeJSON);
}

async function getAndSetCloseStopIDsFor(coords) {
  let stopIDsResponse = [];
  let stopIDsJSON = [];

  try {
    const url = `https://api.tfl.gov.uk/StopPoint/?lat=${coords.latitude}&lon=${coords.longitude}&stopTypes=NaptanPublicBusCoachTram&radius=500`;
    stopIDsResponse = await fetch(url);
  } catch (error) {
    logger.error(
      `Did not receive a response from api url: ${`https://api.tfl.gov.uk/StopPoint/?lat=${coords.latitude}&lon=${coords.longitude}&stopTypes=NaptanPublicBusCoachTram&radius=500`}`
    );
    console.log("Sorry, there seems to be an issue with internet connectivity");
    throw error;
  }

  try {
    stopIDsJSON = await stopIDsResponse.json();
    if (stopIDsJSON.stopPoints.length === 0) {
      throw new Error(`Sorry, there are no bus stops within 500m.`);
    }
  } catch (error) {
    logger.error(`Unable to find a bus stop within 500m of ${coords}`);
    console.log(`no bus stops within 500m.`);
  }

  return getAndSortCloseSopIdsFrom(stopIDsJSON);
}

async function getAndLogBusInfoFor(stopID) {
  const url = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals?app_key=5716904db8c14735b9a633fd6523ee11`;
  try {
    const busInfoResponse = await fetch(url);
    const busInfo = await busInfoResponse.json();

    if (busInfo.length <= 0) {
      throw new Error(`Sorry, there are no buses arriving at this stop.`);
    }
    logBusArrivalTimes(busInfo);
  } catch (error) {
    logger.error(`No buses arriving at this stop, ${stopID}`);
    console.log(`No buses arriving at this stop, ${stopID}.`);
  }
}

//helper functions
function getCoordsFrom(postcodeJSON) {
  const postcodeLocation = {
    longitude: postcodeJSON.result.longitude,
    latitude: postcodeJSON.result.latitude,
  };
  return postcodeLocation;
}

function getAndSortCloseSopIdsFrom(stopIDsJSON) {
  let stopIDs = [];
  const rawStopIDs = stopIDsJSON.stopPoints;

  rawStopIDs.forEach((stop) => {
    stopIDs.push({
      id: stop.naptanId,
      distance: Math.floor(stop.distance),
    });
  });

  stopIDs.sort((a, b) => {
    return a.distance - b.distance;
  });
  return stopIDs.slice(0, 2);
}

function logBusArrivalTimes(busInfo) {
  const arrivals = busInfo;

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

//TODO: fix issue with no buses arriving at a stop.
//TODO: add stop name and nice layout for user.
