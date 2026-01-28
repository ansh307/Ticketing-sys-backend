
const { SeatsioClient, Region } = require('seatsio');

const seatioClient = new SeatsioClient(Region.EU(), process.env.SEATSIO_SECRET_KEY)

module.exports = { seatioClient };