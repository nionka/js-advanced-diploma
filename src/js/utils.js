export function calcTileType(index, boardSize) {
  // TODO: write logic here
  const top = ['top-left', ...Array(boardSize - 2).fill('top'), 'top-right'];
  const bottom = ['bottom-left', ...Array(boardSize - 2).fill('bottom'), 'bottom-right'];
  const center = ['left', ...Array(boardSize - 2).fill('center'), 'right'];
  const board = top.concat(...Array(boardSize - 2).fill(center), bottom);

  return board[index];
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
