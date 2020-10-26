import Character from '../Character';

test('checking for creating a new class Character', () => {
  function createCharacter() {
    return new Character(1, 'Undead');
  }
  expect(createCharacter).toThrowError(new Error('You cannot create objects of this class!'));
});

test('checking for class inheritance', () => {
  function createUndead() {
    class Undead extends Character {
      constructor(level, type = 'generic') {
        super(level, type);
      }
    }
    return new Undead(1, 'Undead');
  }
  const expected = {
    level: 1, attack: 0, defence: 0, health: 50, type: 'Undead',
  };
  expect(createUndead()).toEqual(expected);
});
