const locationService = require("./location.service");

/**
 * Controller for getting route between origin and destination
 */
const getRoute = async (req, res, next) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: "Origin and destination are required" });
    }

    const start = await locationService.getCoordinates(origin);
    const end = await locationService.getCoordinates(destination);

    const route = await locationService.getRoute(start, end);

    res.json(route);
  } catch (error) {
    next(error); // Pass to errorMiddleware
  }
};

module.exports = {
  getRoute
};
