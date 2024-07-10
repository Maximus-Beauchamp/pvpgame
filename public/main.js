import Phaser from 'phaser';
import io from 'socket.io-client';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

const game = new Phaser.Game(config);

let player;
let cursors;
const socket = io('http://localhost:3000');
const otherPlayers = {};

function preload() {
  // No assets to load for now
}

function create() {
  player = this.add.circle(400, 300, 25, 0x00ff00);
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);

  cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.addKeys('W,A,S,D');

  socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
      if (id !== socket.id) {
        addOtherPlayer(this, players[id]);
      }
    });
  });

  socket.on('newPlayer', (playerInfo) => {
    addOtherPlayer(this, playerInfo);
  });

  socket.on('playerMoved', (playerInfo) => {
    if (otherPlayers[playerInfo.id]) {
      otherPlayers[playerInfo.id].x = playerInfo.x;
      otherPlayers[playerInfo.id].y = playerInfo.y;
    }
  });

  socket.on('playerDisconnected', (playerId) => {
    if (otherPlayers[playerId]) {
      otherPlayers[playerId].destroy();
      delete otherPlayers[playerId];
    }
  });
}

function update() {
  const speed = 200;
  player.body.setVelocity(0);

  if (cursors.left.isDown || this.input.keyboard.keys[65].isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown || this.input.keyboard.keys[68].isDown) {
    player.body.setVelocityX(speed);
  }

  if (cursors.up.isDown || this.input.keyboard.keys[87].isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown || this.input.keyboard.keys[83].isDown) {
    player.body.setVelocityY(speed);
  }

  socket.emit('playerMovement', { x: player.x, y: player.y });
}

function addOtherPlayer(scene, playerInfo) {
  const otherPlayer = scene.add.circle(playerInfo.x, playerInfo.y, 25, 0xff0000);
  otherPlayers[playerInfo.id] = otherPlayer;
}
