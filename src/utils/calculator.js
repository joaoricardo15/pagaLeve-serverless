'use strict'

const NUM_DAYS_PER_YEAR = 365;
const NUM_WEEKS_PER_YEAR = 52;
const NUM_MONTHS_PER_YEAR = 12;

const ELECTRICITY_EMISSION_FACTOR = 0.264595;
const VEHICLE_EMISSION_FACTOR = 0.335;
const WASTE_EMISSION_FACTOR = 0.5;
module.exports = class Calculator {

    simulateFootprint(input) {

        const {
            electricity,
            vehicle,
            waste
        } = input
        
        // validate input
        if (typeof electricity !== 'number' || typeof vehicle !== 'number' || typeof waste !== 'number')
            throw 'invalid input'

        // electricity (kWh/month), EF (kg CO2e/kWh), emission (kg CO2e/yr)
        const electricityEmission = electricity * NUM_MONTHS_PER_YEAR * ELECTRICITY_EMISSION_FACTOR;
        
        // vehicle (miles/day), EF (kg CO2e/mile), emissions (kg CO2e/yr)
        const vehicleEmission = vehicle * NUM_DAYS_PER_YEAR * VEHICLE_EMISSION_FACTOR;

        // waste (kg/week), EF (kg CO2e/kg), emissions (kg CO2e/yr)
        const wasteEmission =  waste * NUM_WEEKS_PER_YEAR * WASTE_EMISSION_FACTOR;

        // emissions (kg CO2e/yr)
        const totalEmission = electricityEmission + wasteEmission + vehicleEmission;

        return totalEmission
    }
}
