const { Calculator } = require('../src/utils')

const calculator = new Calculator()

test('correct simulation is generated', () => {
    expect(calculator.simulateFootprint({ electricity: 0, waste: 0, water: 0 })).toBe(0);
    expect(calculator.simulateFootprint({ electricity: 10, waste: 10, water: 10 })).toBe(47190);
});
