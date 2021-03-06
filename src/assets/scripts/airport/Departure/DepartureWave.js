/* eslint-disable no-underscore-dangle, no-mixed-operators, func-names */
import DepartureCyclic from './DepartureCyclic';

/**
 * Generate departures in a repeating wave
 *
 * @class DepartureWave
 */
export default class DepartureWave extends DepartureCyclic {
    constructor(airport, options) {
        super(airport, options);

        base.init.call(this, airport, options);

        // TODO: better commenting of the magic numbers in this file. enumerate the magic numbers.
        // Time between aircraft in the wave
        this._separation = 10;

        // Aircraft per wave
        this._count = Math.floor(this._average / 3600 * this.period);

        if ((this.period / this._separation) < this._count) {
            console.log(`Reducing average departure frequency from ${this._average}/hour to maintain minimum interval`);

            this._count = Math.floor(3600 / this._separation);
        }

        // length of a wave in seconds
        this._waveLength = this._separation * this._count - 1;

        // Offset to have center of wave at 0 time
        this._offset = (this._waveLength - this._separation) / 2 + this.offset;
    }

    nextInterval() {
        const position = (window.gameController.game_time() + this._offset) % this.period;

        if (position >= this._waveLength) {
            return this.period - position;
        }

        return this._separation / prop.game.frequency;
    }
}
