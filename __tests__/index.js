const { onAfterAction } = require('../');

test('adds 1 + 2 to equal 3', () => {
  expect(typeof onAfterAction).toBe('function');
});
