const axios = require("axios");

/**
 * Get coordinates for a given address using Nominatim (OpenStreetMap)
 */
async function getCoordinates(address) {
  // Check if input is already raw coordinates "lat, lon"
  const coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
  if (coordRegex.test(address.trim())) {
    const [lat, lon] = address.split(',').map(coord => parseFloat(coord.trim()));
    return { latitude: lat, longitude: lon };
  }

  // Check if "Nagpur" is already in the query (Specific business logic from original)
  let searchQuery = address;
  if (!searchQuery.toLowerCase().includes("nagpur")) {
    searchQuery = `${address}, Nagpur`;
  }

  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: searchQuery,
        format: "json",
        limit: 1
      },
      headers: {
        "User-Agent": "RoutePlannerBackend"
      }
    }
  );

  if (!response.data || !response.data.length) {
    throw new Error(`Location not found: ${searchQuery}`);
  }

  return {
    latitude: parseFloat(response.data[0].lat),
    longitude: parseFloat(response.data[0].lon)
  };
}

/**
 * Get route between two coordinates using OSRM
 */
async function getRoute(start, end) {
  const response = await axios.get(
    `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
  );

  const route = response.data.routes[0];

  return {
    distance: route.distance,
    duration: route.duration,
    coordinates: route.geometry.coordinates
  };
}

module.exports = {
  getCoordinates,
  getRoute
};
