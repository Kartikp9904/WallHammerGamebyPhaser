import Phaser from "phaser";
import Bootloader from "./scenes/bootloader";
import Outro from "./scenes/outro";
import Splash from "./scenes/splash";
import Transition from "./scenes/transition";
import Game from "./scenes/game";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  autoRound: false,
  parent: "contenedor",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [Bootloader, Splash, Transition, Game, Outro],
};

const game = new Phaser.Game(config);
