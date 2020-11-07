/* eslint-disable max-len */
import Bowman from './Characters/Bowman';
import Swordsman from './Characters/Swordsman';
import Magician from './Characters/Magician';
import Daemon from './Characters/Daemon';
import Undead from './Characters/Undead';
import Vampire from './Characters/Vampire';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import Team from './Team';
import themes from './themes';
import cursors from './cursors';
import GameState from './GameState';
import GamePlay from './GamePlay';

const userPosition = [0, 1, 8, 9, 16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57];
const botPosition = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
const userPerson = [Bowman, Swordsman, Magician];
const botPerson = [Daemon, Undead, Vampire];

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.userTeam = new Team();
    this.botTeam = new Team();
    this.command = [];
    this.counter = 0;
    this.indexChar = null;
    this.indexCursor = null;
    this.levelGame = 1;
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.drawUi(themes.prairie);

    this.userTeam.addAll(...generateTeam(userPerson, 1, 2));
    this.botTeam.addAll(...generateTeam(botPerson, 1, 2));
    this.getCommand(this.userTeam, userPosition);
    this.getCommand(this.botTeam, botPosition);

    this.gamePlay.redrawPositions(this.command);

    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
  }

  getRandomPosition(positions) {
    return positions[Math.floor(Math.random() * positions.length)];
  }

  findCharacter(index) {
    return this.command.find((elem) => (elem.position === index));
  }

  getCommand(team, positions) {
    for (const elem of team) {
      this.command.push(new PositionedCharacter(elem, this.getRandomPosition(positions)));
    }
  }

  checkMove(indexPerson, index, char) {
    const dist = char.character.distance;
    const field = this.gamePlay.boardSize;
    const left = [0, 8, 16, 24, 32, 40, 48, 56];
    const right = [7, 15, 23, 31, 39, 47, 55, 63];
    const result = [];

    for (let i = 1; i <= dist; i += 1) {
      result.push(indexPerson + (field * i));
      result.push(indexPerson - (field * i));
    }

    for (let i = 1; i <= dist; i += 1) {
      if (left.includes(indexPerson)) {
        break;
      }

      result.push(indexPerson - i);
      result.push(indexPerson - (field * i + i));
      result.push(indexPerson + (field * i - i));

      if (left.includes(indexPerson - i)) {
        break;
      }
    }

    for (let i = 1; i <= dist; i += 1) {
      if (right.includes(indexPerson)) {
        break;
      }

      result.push(indexPerson + i);
      result.push(indexPerson - (field * i - i));
      result.push(indexPerson + (field * i + i));

      if (right.includes(indexPerson + i)) {
        break;
      }
    }

    return result.includes(index);
  }

  checkAttack(indexPerson, index, char) {
    const dist = char.character.attackRange;
    const field = this.gamePlay.boardSize;
    const left = [0, 8, 16, 24, 32, 40, 48, 56];
    const right = [7, 15, 23, 31, 39, 47, 55, 63];
    const result = [];

    for (let i = 1; i <= dist; i += 1) {
      result.push(indexPerson + (field * i));
      result.push(indexPerson - (field * i));
    }

    for (let i = 1; i <= dist; i += 1) {
      if (left.includes(indexPerson)) {
        break;
      }

      result.push(indexPerson - i);
      for (let j = 1; j <= dist; j += 1) {
        result.push(indexPerson - i + field * j);
        result.push(indexPerson - i - field * j);
      }

      if (left.includes(indexPerson - i)) {
        break;
      }
    }

    for (let i = 1; i <= dist; i += 1) {
      if (right.includes(indexPerson)) {
        break;
      }

      result.push(indexPerson + i);
      for (let j = 1; j <= dist; j += 1) {
        result.push(indexPerson + i + field * j);
        result.push(indexPerson + i - field * j);
      }

      if (right.includes(indexPerson + i)) {
        break;
      }
    }

    return result.includes(index);
  }

  onCellClick(index) {
    if (this.findCharacter(index)) {
      if (userPerson.some((elem) => this.findCharacter(index).character instanceof elem)) {
        console.log('ololo');
        if (this.indexChar === null) {
          this.indexChar = index;
        } else {
          this.gamePlay.deselectCell(this.indexChar);
          this.gamePlay.deselectCell(this.indexCursor);
        }
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.selectCell(index);
        this.indexChar = index;
      } else if (this.indexChar === null) {
        GamePlay.showError('Это не Ваш персонаж!');
      }
    }

    if (this.indexChar !== null) {
      if (this.checkMove(this.indexChar, index, this.findCharacter(this.indexChar)) && !this.findCharacter(index)) {
        this.findCharacter(this.indexChar).position = index;
        this.gamePlay.deselectCell(this.indexChar);
        this.gamePlay.deselectCell(this.indexCursor);
        this.indexChar = null;
        this.gamePlay.redrawPositions(this.command);
      }

      if (botPerson.some((elem) => this.findCharacter(index).character instanceof elem) && this.checkAttack(this.indexChar, index, this.findCharacter(this.indexChar))) {
        console.log('okioki');
      }
    }
    // TODO: react to click
  }

  onCellEnter(index) {
    if (this.findCharacter(index)) {
      const char = this.findCharacter(index).character;
      const message = `\u{1F396}${char.level}\u{2694}${char.attack}\u{1F6E1}${char.defence}\u{2764}${char.health}`;
      this.gamePlay.showCellTooltip(message, index);
    }
    // TODO: react to mouse enter
    if (this.indexChar !== null) {
      this.gamePlay.setCursor(cursors.notallowed);
      if (this.indexCursor === null) {
        this.indexCursor = index;
      } else {
        this.gamePlay.deselectCell(this.indexCursor);
      }

      if (this.findCharacter(index) && userPerson.some((elem) => this.findCharacter(index).character instanceof elem)) {
        this.gamePlay.setCursor(cursors.pointer);
      }

      if (this.indexChar !== index) {
        if (!this.findCharacter(index) && this.checkMove(this.indexChar, index, this.findCharacter(this.indexChar))) {
          this.gamePlay.selectCell(index, 'green');
          this.gamePlay.setCursor(cursors.pointer);
          this.indexCursor = index;
        }

        if (this.findCharacter(index) && botPerson.some((elem) => this.findCharacter(index).character instanceof elem) && this.checkAttack(this.indexChar, index, this.findCharacter(this.indexChar))) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
          this.indexCursor = index;
        }
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
    // TODO: react to mouse leave
  }
}
