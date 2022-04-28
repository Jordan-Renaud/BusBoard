const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const apiKey = "";
const stopID = "490008660N";
const url = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals?app_key=${apiKey}`;

fetch(url)
  .then((response) => response.json())
  .then((body) => console.log(body));
