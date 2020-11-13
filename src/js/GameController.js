/* eslint-disable no-restricted-syntax */
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
    this.points = 0;
    this.pointsAll = [];
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.drawUi(themes.prairie);

    this.userTeam.addAll(...generateTeam([Bowman, Swordsman], 1, 2));
    this.botTeam.addAll(...generateTeam(botPerson, 1, 2));
    this.getCommand(this.userTeam, userPosition);
    this.getCommand(this.botTeam, botPosition);

    this.gamePlay.redrawPositions(this.command);

    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
  }

  getRandomPosition(positions) {
    let pos = positions[Math.floor(Math.random() * positions.length)];

    while (this.checkRandomPosition(pos)) {
      pos = positions[Math.floor(Math.random() * positions.length)];
    }
    return pos;
  }

  checkRandomPosition(pos) {
    return this.command.some((elem) => (elem.position === pos));
  }

  findChar(index) {
    return this.command.find((elem) => (elem.position === index));
  }

  getCommand(team, positions) {
    for (const elem of team) {
      this.command.push(new PositionedCharacter(elem, this.getRandomPosition(positions)));
    }
  }

  checkMove(indexChar, index, char) {
    const arr = this.calculateMove(indexChar, char);
    return arr.includes(index);
  }

  calculateMove(indexChar, char) {
    const dist = char.character.distance;
    const field = this.gamePlay.boardSize;
    const left = [0, 8, 16, 24, 32, 40, 48, 56];
    const right = [7, 15, 23, 31, 39, 47, 55, 63];
    const result = [];

    for (let i = 1; i <= dist; i += 1) {
      result.push(indexChar + (field * i));
      result.push(indexChar - (field * i));
    }

    for (let i = 1; i <= dist; i += 1) {
      if (left.includes(indexChar)) {
        break;
      }

      result.push(indexChar - i);
      result.push(indexChar - (field * i + i));
      result.push(indexChar + (field * i - i));

      if (left.includes(indexChar - i)) {
        break;
      }
    }

    for (let i = 1; i <= dist; i += 1) {
      if (right.includes(indexChar)) {
        break;
      }

      result.push(indexChar + i);
      result.push(indexChar - (field * i - i));
      result.push(indexChar + (field * i + i));

      if (right.includes(indexChar + i)) {
        break;
      }
    }

    return result.filter((value) => value >= 0 && value <= 63);
  }

  checkAttack(indexChar, index, char) {
    const arr = this.calculateAttack(indexChar, char);
    return arr.includes(index);
  }

  calculateAttack(indexChar, char) {
    const dist = char.character.attackRange;
    const field = this.gamePlay.boardSize;
    const left = [0, 8, 16, 24, 32, 40, 48, 56];
    const right = [7, 15, 23, 31, 39, 47, 55, 63];
    const result = [];

    for (let i = 1; i <= dist; i += 1) {
      result.push(indexChar + (field * i));
      result.push(indexChar - (field * i));
    }

    for (let i = 1; i <= dist; i += 1) {
      if (left.includes(indexChar)) {
        break;
      }

      result.push(indexChar - i);
      for (let j = 1; j <= dist; j += 1) {
        result.push(indexChar - i + field * j);
        result.push(indexChar - i - field * j);
      }

      if (left.includes(indexChar - i)) {
        break;
      }
    }

    for (let i = 1; i <= dist; i += 1) {
      if (right.includes(indexChar)) {
        break;
      }

      result.push(indexChar + i);
      for (let j = 1; j <= dist; j += 1) {
        result.push(indexChar + i + field * j);
        result.push(indexChar + i - field * j);
      }

      if (right.includes(indexChar + i)) {
        break;
      }
    }

    return result.filter((value) => value >= 0 && value <= 63);
  }

  checkWin() {
    if (this.levelGame === 4 && this.botTeam.members.size === 0) {
      this.scoring();
      this.pointsAll.push(this.points);
      GamePlay.showMessage(`Поздравляю, вы выиграли!!! Количество набранных очков за игру ${this.points}, максимальное количество ${Math.max(this.pointsAll)}`);
      this.levelGame += 1;
    }

    if (this.botTeam.members.size === 0 && this.levelGame <= 3) {
      this.levelGame += 1;
      GamePlay.showMessage(`Переход на уровень ${this.levelGame}!`);
      this.scoring();
      this.getLevelUp();
    }

    if (this.userTeam.members.size === 0) {
      this.pointsAll.push(this.ponts);
      GamePlay.showMessage(`Очень жаль, вы проиграли :(!!! Количество набранных очков за игру ${this.points}, максимальное количество ${Math.max(this.pointsAll)}`);
    }
  }

  getLevelUp() {
    this.command = [];
    this.userTeam.members.forEach((char) => char.levelUp());

    if (this.levelGame === 2) {
      this.gamePlay.drawUi(themes.desert);
      this.userTeam.addAll(...generateTeam(userPerson, 1, 1));
      this.botTeam.addAll(...generateTeam(botPerson, 2, this.userTeam.members.size));
    }

    if (this.levelGame === 3) {
      this.gamePlay.drawUi(themes.arctic);
      this.userTeam.addAll(...generateTeam(userPerson, 2, 2));
      this.botTeam.addAll(...generateTeam(botPerson, 3, this.userTeam.members.size));
    }

    if (this.levelGame === 4) {
      this.gamePlay.drawUi(themes.mountain);
      this.userTeam.addAll(...generateTeam(userPerson, 3, 2));
      this.botTeam.addAll(...generateTeam(botPerson, 4, this.userTeam.members.size));
    }

    this.getCommand(this.userTeam, userPosition);
    this.getCommand(this.botTeam, botPosition);
    this.gamePlay.redrawPositions(this.command);
  }

  enterAttack(index) {
    const attacker = this.findChar(this.indexChar).character;
    const target = this.findChar(index).character;
    const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);

    this.gamePlay.showDamage(index, damage).then(() => {
      target.health -= damage;
      if (target.health <= 0) {
        this.command.splice(this.command.indexOf(this.findChar(index)), 1);
        this.userTeam.delete(target);
        this.botTeam.delete(target);
      }
    }).then(() => {
      this.gamePlay.redrawPositions(this.command);
      this.checkWin();
      this.botPlaying();
    }).catch((err) => {
      GamePlay.showError(err);
    });
  }

  scoring() {
    this.points += this.userTeam.toArray().reduce((a, b) => a + b.health, 0);
  }

  botPlaying() {
    if (this.counter !== 1 || this.botTeam.members.size === 0) {
      return;
    }

    const botCommand = this.command.filter((elem) => (elem.character instanceof Vampire || elem.character instanceof Daemon || elem.character instanceof Undead));
    const userCommand = this.command.filter((elem) => (elem.character instanceof Bowman || elem.character instanceof Swordsman || elem.character instanceof Magician));
    let bot = null;
    let target = null;

    botCommand.forEach((elem) => {
      const botAttack = this.calculateAttack(elem.position, elem);
      userCommand.forEach((val) => {
        if (botAttack.includes(val.position)) {
          bot = elem;
          target = val;
        }
      });
    });

    if (target) {
      const damage = Math.max(bot.character.attack - target.character.defence, bot.character.attack * 0.1);
      this.gamePlay.showDamage(target.position, damage).then(() => {
        target.character.health -= damage;
        if (target.character.health <= 0) {
          this.command.splice(this.command.indexOf(this.findChar(target.position)), 1);
          this.userTeam.delete(target.character);
          this.botTeam.delete(target.character);
        }
      }).then(() => {
        this.gamePlay.redrawPositions(this.command);
        this.checkWin();
      }).catch((err) => {
        GamePlay.showError(err);
      });
    } else {
      bot = botCommand[Math.floor(Math.random() * botCommand.length)];
      const botMove = this.calculateMove(bot.position, bot);
      this.findChar(bot.position).position = this.getRandomPosition(botMove);
      this.gamePlay.redrawPositions(this.command);
    }

    this.counter = 0;
  }

  onNewGameClick() {
    this.userTeam = new Team();
    this.botTeam = new Team();
    this.command = [];
    this.counter = 0;
    this.indexChar = null;
    this.indexCursor = null;
    this.levelGame = 1;
    this.points = 0;

    this.gamePlay.drawUi(themes.prairie);

    this.userTeam.addAll(...generateTeam([Bowman, Swordsman], 1, 2));
    this.botTeam.addAll(...generateTeam(botPerson, 1, 2));
    this.getCommand(this.userTeam, userPosition);
    this.getCommand(this.botTeam, botPosition);

    this.gamePlay.redrawPositions(this.command);
  }

  onSaveGameClick() {
    const savedGame = {
      command: this.command,
      levelGame: this.levelGame,
      counter: this.counter,
      points: this.points,
      pointsAll: this.pointsAll,
    };
    this.stateService.save(GameState.from(savedGame));
    GamePlay.showMessage('Идет сохранение игры!');
  }

  onLoadGameClick() {
    GamePlay.showMessage('Загрузка данных!');
    const load = (this.stateService.load());
    this.levelGame = load.levelGame;
    this.counter = load.counter;
    this.points = load.points;
    this.pointsAll = load.pointsAll;

    this.userTeam = new Team();
    this.botTeam = new Team();

    this.command = load.command.map((elem) => {
      let char;
      const {
        character: {
          level, type, health, attack, defence,
        }, position,
      } = elem;
      switch (type) {
        case 'bowman':
          char = new Bowman(level);
          break;
        case 'swordsman':
          char = new Swordsman(level);
          break;
        case 'magician':
          char = new Magician(level);
          break;
        case 'vampire':
          char = new Vampire(level);
          break;
        case 'undead':
          char = new Undead(level);
          break;
        default:
          char = new Daemon(level);
      }

      char.health = health;
      char.attack = attack;
      char.defence = defence;

      if (type === 'bowman' || type === 'swordsman' || type === 'magician') {
        this.userTeam.add(char);
      } else {
        this.botTeam.add(char);
      }

      return new PositionedCharacter(char, position);
    });

    switch (this.levelGame) {
      case 1:
        this.gamePlay.drawUi(themes.prairie);
        break;
      case 2:
        this.gamePlay.drawUi(themes.desert);
        break;
      case 3:
        this.gamePlay.drawUi(themes.arctic);
        break;
      default:
        this.gamePlay.drawUi(themes.mountain);
        break;
    }

    this.gamePlay.redrawPositions(this.command);
  }

  onCellClick(index) {
    if (this.levelGame === 5 || this.userTeam.members.size === 0) {
      return;
    }

    if (this.counter === 1) {
      GamePlay.showMessage('Не ваш ход!');
      return;
    }

    if (this.findChar(index)) {
      if (userPerson.some((elem) => this.findChar(index).character instanceof elem)) {
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
      if (this.checkMove(this.indexChar, index, this.findChar(this.indexChar)) && !this.findChar(index)) {
        this.findChar(this.indexChar).position = index;
        this.gamePlay.deselectCell(this.indexChar);
        this.gamePlay.deselectCell(this.indexCursor);
        this.indexChar = null;
        this.counter = 1;
        this.gamePlay.redrawPositions(this.command);
        this.botPlaying();
      }

      if (this.findChar(index) && botPerson.some((elem) => this.findChar(index).character instanceof elem) && this.checkAttack(this.indexChar, index, this.findChar(this.indexChar))) {
        this.enterAttack(index);
        this.gamePlay.deselectCell(this.indexChar);
        this.gamePlay.deselectCell(this.indexCursor);
        this.indexChar = null;
        this.counter = 1;
        this.gamePlay.setCursor(cursors.auto);
      }

      if (this.indexChar !== index && this.gamePlay.boardEl.style.cursor === 'not-allowed') {
        GamePlay.showMessage('Так делать нельзя!');
      }
    }
    // TODO: react to click
  }

  onCellEnter(index) {
    if (this.findChar(index)) {
      const char = this.findChar(index).character;
      const message = `\u{1F396}${char.level}\u{2694}${char.attack}\u{1F6E1}${char.defence}\u{2764}${char.health}`;
      this.gamePlay.showCellTooltip(message, index);
    }
    // TODO: react to mouse enter
    if (this.indexChar !== null) {
      this.gamePlay.setCursor(cursors.notallowed);
      if (this.indexCursor === null) {
        this.indexCursor = index;
      } else if (this.indexChar !== this.indexCursor) {
        this.gamePlay.deselectCell(this.indexCursor);
      }

      if (this.findChar(index) && userPerson.some((elem) => this.findChar(index).character instanceof elem)) {
        this.gamePlay.setCursor(cursors.pointer);
      }

      if (this.indexChar !== index) {
        if (!this.findChar(index) && this.checkMove(this.indexChar, index, this.findChar(this.indexChar))) {
          this.gamePlay.selectCell(index, 'green');
          this.gamePlay.setCursor(cursors.pointer);
          this.indexCursor = index;
        }

        if (this.findChar(index) && botPerson.some((elem) => this.findChar(index).character instanceof elem) && this.checkAttack(this.indexChar, index, this.findChar(this.indexChar))) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
          this.indexCursor = index;
        }
      }
    } else {
      this.gamePlay.setCursor(cursors.auto);
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
    // TODO: react to mouse leave
  }
}
