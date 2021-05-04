const { Calculator } = require('../src/utils')

const calculator = new Calculator()

test('correct simulation is generated', () => {
    expect(calculator.simulateFootprint({ electricity: 0, vehicle: 0, waste: 0 })).toBe(0);
    expect(calculator.simulateFootprint({ electricity: 10, vehicle: 10, waste: 10 })).toBe(1514.5014);
});
