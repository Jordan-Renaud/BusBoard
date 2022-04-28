import fetch from "node-fetch";

const stopID = "490008660N";
const url = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`;

const response = await fetch(url);
const arrivals = await response.json();

//sort arrivals with time to station
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
