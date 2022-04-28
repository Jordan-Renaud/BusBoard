import fetch from "node-fetch";

const apiKey = "";
const stopID = "490008660N";
const url = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals?app_key=${apiKey}`;

const response = await fetch(url);
const arrivals = await response.json();

arrivals.forEach((busArrival) => {
  console.log(busArrival);
});
