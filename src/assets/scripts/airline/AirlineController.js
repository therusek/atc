import Airline from './AirlineModel';

// Temporary const declaration here to attach to the window AND use as internal property
const airline = {};

/**
 * @class AirlineController
 */
export default class AirlineController {
    /**
     * @constructor
     */
    constructor() {
        this.airline = airline;
        this.airline.airlines = {};
    }

    /**
     * @for AirlineController
     * @method init_pre
     */
    init_pre() {
        prop.airline = airline;
        // prop.airline.airlines = {};
    }

    /**
     * @for AirlineController
     * @method airline_get
     * @param icao {string}
     * return {AirlineModel|object|null}
     */
    airline_get(icao) {
        icao = icao.toLowerCase();

        if (!(icao in this.airline.airlines)) {
            const airlineToAdd = new Airline(
                icao,
                {
                    url: `assets/airlines/${icao}.json`
                }
            );

            this.airline.airlines[icao] = airlineToAdd;
        }

        return this.airline.airlines[icao];
    }
}
