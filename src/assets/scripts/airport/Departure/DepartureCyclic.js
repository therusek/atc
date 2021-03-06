/* eslint-disable no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import DepartureBase from './DepartureBase';
import { sin } from '../../math/core';
import { tau } from '../../math/circle';

/**
 * Generate departures in cyclic pattern
 *
 * @class DepartureCyclic
 */
export default class DepartureCyclic extends DepartureBase {
    constructor(airport, options) {
        super(airport, options);

        // TODO: what do all these numbers mean? enumerate the magic numbers.
        this.period = 60 * 60;
        this.offset = -15 * 60; // Start at the peak

        this._amplitude = 3600 / this.frequency / 2;
        this._average = 3600 / this.frequency;
    }

    /**
     * Additional supported options
     *
     * period: {integer} Optionally specify the length of a cycle in minutes
     * offset: {integer} Optionally specify when the cycle peaks in minutes
     */
    parse(options) {
        super.parse(options);

        if (options.period) {
            this.period = options.period * 60;
        }

        if (options.offset) {
            // TODO: enumerate the magic numbers
            this.offset = -this.period / 4 + options.offset * 60;
        }
    }

    nextInterval() {
        // This is a [poorly named] example of how a really long calculation can be broken up into
        // more readable bits. the original calculation much harder to read.
        //
        // (this._amplitude * Math.sin(tau() * ((game_time() + this.offset) / this.period)) + this._average) / prop.game.frequency;

        const gameTimeWithOffset = window.gameController.game_time() + this.offset;
        const sinOffsetOverPeriod = sin(tau() * (gameTimeWithOffset / this.period));
        const amplitudeTimesSinOffsetOverPeriod = this._amplitude * sinOffsetOverPeriod;

        return (amplitudeTimesSinOffsetOverPeriod + this._average) / prop.game.frequency;
    }
}
