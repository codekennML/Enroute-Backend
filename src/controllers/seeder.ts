const { stations } = require("./stations/all")
const { busStationDataLayer } = require("../repository/busStation")

const seedStations = async () => {
    try {

        const operations = stations.map(station => ({
            name: station.name,
            location: {
                type: "Point",
                coordinates: [station.geometry.location.lat, station.geometry.location.lng]
            },
            town: station.town,
            state: station.state,
            country: station.country

        }))

        const response = await busStationDataLayer.bulkUpdateBusStation({
            operations,
            options: {

            }
        })
        console.log("Stations completely logged")

    } catch (e) {
        console.error("An error occured")
    }
}

seedStations()