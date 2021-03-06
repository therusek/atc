/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import _get from 'lodash/get';
import _forEach from 'lodash/forEach';

/**
 * An aircrcraft operating agency
 *
 * @class AirlineModel
 */
export default class AirlineModel {
    /**
     * Create new airline
     *
     * @constructor
     * @for AirlineModel
     * @param icao {string}
     * @param options {object}
     */
    constructor(icao, options) {
        // ICAO airline designation
        this.icao = icao;
        // Agency name
        this.name = _get(options, 'name', 'Default airline');
        // Radio callsign
        this.callsign = 'Default';
        // Parameters for flight number generation
        this.flightNumberGeneration = {
            // How many characters in the flight number
            length: 3,
            // Whether to use alphabetical characters
            alpha: false
        };

        // Named weighted sets of aircraft
        this.fleets = {
            default: []
        };

        this.loading = true;
        this.loaded = false;
        this.priorityLoad = false;
        this._pendingAircraft = [];

        this.parse(options);

        if (options.url) {
            this.load(options.url);
        }
    }

    /**
     * Initialize object from data
     *
     * This method will be called twice at minimum; once on instantiation and again once
     * `onLoadSuccess`. Most of the properties below will only be available `onLoadSuccess`
     *
     * @for AirlineModel
     * @method parse
     * @param data {object}
     */
    parse(data) {
        this.icao = _get(data, 'icao', this.icao);

        if (data.callsign) {
            this.callsign = data.callsign.name;

            if (data.callsign.length) {
                this.flightNumberGeneration.length = data.callsign.length;
            }

            this.flightNumberGeneration.alpha = (data.callsign.alpha === true);
        }

        if (data.fleets) {
            this.fleets = data.fleets;
        } else if (data.aircraft) {
            this.fleets.default = data.aircraft;
        }

        _forEach(this.fleets, (fleet) => {
            for (let j = 0; j < fleet.length; j++) {
                fleet[j][0] = fleet[j][0].toLowerCase();
            }
        });
    }

    /**
     * Load the data for this airline
     *
     * @for AirlineModel
     * @method load
     * @param url {string}
     */
    load(url) {
        this._url = url;

        if (this.loaded) {
            return;
        }

        zlsa.atc.loadAsset({
            url: url,
            immediate: this.priorityLoad
        })
        .done((response) => this.onLoadSuccess(response))
        .fail((...args) => this.onLoadError(...args));
    }

    /**
     * @for AirlineModel
     * @method onLoadSuccess
     * @param response {object}
     */
    onLoadSuccess(response) {
        this.parse(response);

        this.loading = false;
        this.loaded = true;

        this.validateFleets();
        this._generatePendingAircraft();
    }

    /**
     * @for AirlineModel
     * @method onLoadError
     * @param textStatus {string}
     */
    onLoadError({ textStatus }) {
        this.loading = false;
        this._pendingAircraft = [];

        console.error(`Unable to load airline/${this.icao}: ${textStatus}`);
    }

    /**
     * Return a random ICAO aircraft designator from the given fleet
     *
     * If no fleet is specified the default fleet is used
     *
     * @for AirlineModel
     * @method chooseAircraft
     * @param fleet
     * @return
     */
    chooseAircraft(fleet = '') {
        if (fleet === '') {
            fleet = 'default';
        }

        // TODO: this try/catch block could be improved. its hard to tell what his block is actually doing.
        try {
            return choose_weight(this.fleets[fleet.toLowerCase()]);
        } catch (error) {
            console.log(`Unable to find fleet ${fleet} for airline ${this.icao}`);

            throw error;
        }
    }

    /**
     * Create an aircraft
     *
     * @for AirlineModel
     * @method generateAircraft
     * @param options {object}
     * @return
     */
    generateAircraft(options) {
        if (!this.loaded) {
            if (this.loading) {
                this._pendingAircraft.push(options);

                if (!this.priorityLoad) {
                    zlsa.atc.loadAsset({
                        url: this._url,
                        immediate: true
                    });

                    this.priorityLoad = true;
                }

                return true;
            } else {
                console.warn(`Unable to spawn aircraft for airline/ ${this.icao} as loading failed`);

                return false;
            }
        }

        return this._generateAircraft(options);
    }

    /**
     * Create a flight number/identifier
     *
     * @for AirlineModel
     * @method generateFlightNumber
     * @return flightNumber {string}
     */
    generateFlightNumber() {
        const flightNumberLength = this.flightNumberGeneration.length;
        let flightNumber = '';
        let list = '0123456789';

        // Start with a number other than zero
        flightNumber += choose(list.substr(1));

        if (this.flightNumberGeneration.alpha) {
            for (let i = 0; i < flightNumberLength - 3; i++) {
                flightNumber += choose(list);
            }

            list = 'abcdefghijklmnopqrstuvwxyz';

            for (let i = 0; i < 2; i++) {
                flightNumber += choose(list);
            }
        } else {
            for (let i = 1; i < flightNumberLength; i++) {
                flightNumber += choose(list);
            }
        }

        return flightNumber;
    }

    /**
     * Checks all fleets for valid aircraft identifiers and log errors
     *
     * @for AirlineModel
     * @method validateFleets
     */
    validateFleets() {
        _forEach(this.fleets, (fleet) => {
            for (let j = 0; j < fleet.length; j++) {
                // Preload the aircraft model
                window.aircraftController.aircraft_model_get(fleet[j][0]);

                if (typeof fleet[j][1] !== 'number') {
                    console.warn(`Airline ${this.icao.toUpperCase()} uses non numeric weight for aircraft ${fleet[j][0]}, expect errors`);
                }
            }
        });
    }

    /**
     * @for AirlineModel
     * @method _generateAircraft
     * @param options {object}
     * @return {function}
     */
    _generateAircraft(options) {
        if (!options.callsign) {
            options.callsign = window.aircraftController.aircraft_callsign_new(options.airline);
        }

        if (!options.icao) {
            options.icao = this.chooseAircraft(options.fleet);
        }

        const model = window.aircraftController.aircraft_model_get(options.icao.toLowerCase());

        return model.generateAircraft(options);
        // FIXME: this block is unreachable, is it needed?
        // var icao = options.icao.toLowerCase();
    }

    /**
     * Generate aircraft which were queued while the model loaded
     *
     * @for AirlineModel
     * @method _generatePendingAircraft
     * @private
     */
    _generatePendingAircraft() {
        _forEach(this._pendingAircraft, (aircraftOptions) => {
            this._generateAircraft(aircraftOptions);
        });

        this._pendingAircraft = null;
    }
}
