'use strict'

const NUM_DAYS_PER_YEAR = 365;
const NUM_WEEKS_PER_YEAR = 52;
const NUM_MONTHS_PER_YEAR = 12;

const ELECTRICITY_EMISSION_FACTOR = 11;
const WASTE_EMISSION_FACTOR = 11;
const WATER_EMISSION_FACTOR = 11;

module.exports = class Calculator {

    simulateFootprint(input) {

        const {
            electricity,
            waste,
            water
        } = input
        
        // validate input
        if (typeof electricity !== 'number' || typeof waste !== 'number' || typeof water !== 'number')
            throw 'invalid input'

        // electricity (kWh/yr), EF (kg CO2e/kWh), emission (kg CO2e/yr)
        const electricityEmission = electricity * NUM_MONTHS_PER_YEAR * ELECTRICITY_EMISSION_FACTOR;
        
        // waste (kg/week), EF (kg CO2e/kg), emissions (kg CO2e/yr)
        const wasteEmission =  waste * NUM_WEEKS_PER_YEAR * WASTE_EMISSION_FACTOR;

        // water (litres/day), EF (kg CO2e/kWh), emissions (kg CO2e/yr)
        const waterEmission = water * NUM_DAYS_PER_YEAR * WATER_EMISSION_FACTOR;

        // emissions (kg CO2e/yr)
        const totalEmission = electricityEmission + wasteEmission + waterEmission;

        return totalEmission
    }
}
