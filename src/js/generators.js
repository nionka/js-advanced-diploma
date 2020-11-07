/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */

function levelGenerator(maxLevel) {
  const max = maxLevel;

  return Math.floor(Math.random() * max) + 1;
}

export function* characterGenerator(allowedTypes, maxLevel) {
  // TODO: write logic here
  while (true) {
    const n = Math.floor(Math.random() * allowedTypes.length);
    yield new allowedTypes[n](levelGenerator(maxLevel));
  }
}

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  // TODO: write logic here
  const team = [];
  const character = characterGenerator(allowedTypes, maxLevel);

  for (let i = 0; i < characterCount; i += 1) {
    team.push(character.next(i).value);
  }

  return team;
}
