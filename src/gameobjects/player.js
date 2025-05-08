import Blow from "./blow";
import Brick from "./brick";
import { JumpSmoke } from "./particle";

class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, health = 1) {
    super(scene, x, y, "walt");
    this.setOrigin(0.5);

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.cursor = this.scene.input.keyboard.createCursorKeys();
    this.spaceBar = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.down = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.DOWN
    );
    this.right = true;
    this.body.setGravityY(100);
    this.body.setSize(48, 60);
    this.init();
    this.jumping = false;
    this.building = false;
    this.falling = false;
    this.mjolnir = false;
    this.walkVelocity = 200;
    this.jumpVelocity = -400;
    this.invincible = false;
    this.jumpCount = 0;
    this.maxJumps = 1;


    this.health = health;

    this.dead = false;

    this.W = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.A = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.S = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.D = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  /*
    Inits the animations for the player: init, idle, walk, jump, death, etc... and it adds a listener for the `animationcomplete` event.
    */
  init() {
    this.scene.anims.create({
      key: "startidle",
      frames: this.scene.anims.generateFrameNumbers("walt", {
        start: 0,
        end: 1,
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.scene.anims.create({
      key: "playeridle",
      frames: this.scene.anims.generateFrameNumbers("walt", {
        start: 2,
        end: 3,
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.scene.anims.create({
      key: "playerwalk",
      frames: this.scene.anims.generateFrameNumbers("walt", {
        start: 4,
        end: 6,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.scene.anims.create({
      key: "playerjump",
      frames: this.scene.anims.generateFrameNumbers("walt", {
        start: 4,
        end: 4,
      }),
      frameRate: 1,
    });

    this.scene.anims.create({
      key: "playerhammer",
      frames: this.scene.anims.generateFrameNumbers("walt", {
        start: 7,
        end: 8,
      }),
      frameRate: 10,
    });

    this.scene.anims.create({
      key: "playerbuild",
      frames: this.scene.anims.generateFrameNumbers("walt", {
        start: 9,
        end: 10,
      }),
      frameRate: 10,
      repeat: 2,
    });

    this.scene.anims.create({
      key: "playerdead",
      frames: this.scene.anims.generateFrameNumbers("walt", {
        start: 11,
        end: 16,
      }),
      frameRate: 5,
    });

    this.anims.play("startidle", true);

    this.on("animationcomplete", this.animationComplete, this);
  }

  /*
    In the update function, we set the player movement according to the controls. We check if the player is jumping, falling, walking, etc...
    */
    update() {
      if (this.dead) {
        // If dead, ensure the death animation or behavior runs once
        if (!this.deadAnimationPlayed) {
          this.deadAnimationPlayed = true;
          console.log("Death animation is being played.");
          this.anims.play("playerdead", true);
        }
        return; // Exit the rest of the update logic
      }
    
      if (this.jumping) {
        // Handle falling and gravity changes
        if (this.body.velocity.y >= 0) {
          this.body.setGravityY(700); // Increased gravity when falling
          this.falling = true;
        }
      }
    
      // Double Jump Mechanism (ensures maximum jumps)
      if (
        (Phaser.Input.Keyboard.JustDown(this.cursor.up) || Phaser.Input.Keyboard.JustDown(this.W)) &&
        this.jumpCount < this.maxJumps // Allow jump only if jumpCount is less than maxJumps
      ) {
        this.building = false;
        this.body.setVelocityY(this.jumpVelocity); // Set vertical velocity for jumping
        this.body.setGravityY(400); // Normal gravity when jumping
        this.anims.play("playerjump", true); // Play jump animation
        this.scene.playAudio("jump"); // Play jump sound
        this.jumping = true; // Set jumping to true
        this.jumpSmoke(); // Create jump smoke effect
    
        // Increment jump count if it's a valid jump (first jump or second jump in double-jump)
        this.jumpCount = this.body.blocked.down ? 1 : this.jumpCount + 1;
      }
    
      // Horizontal movement (Left and Right)
      if (this.cursor.right.isDown || this.D.isDown) {
        this.building = false;
        if (this.body.blocked.down) {
          this.jumpCount = 0; // Reset jump count on landing
          this.anims.play("playerwalk", true);
        }
        this.right = true;
        this.flipX = this.body.velocity.x < 0;
        this.body.setVelocityX(this.walkVelocity);
      } else if (this.cursor.left.isDown || this.A.isDown) {
        this.building = false;
        if (this.body.blocked.down) {
          this.anims.play("playerwalk", true);
        }
        this.right = false;
        this.flipX = true;
        this.body.setVelocityX(-this.walkVelocity);
      } else {
        if (this.body.blocked.down) {
          if (this.jumping) {
            this.scene.playAudio("land");
            this.landSmoke(); // Create landing smoke effect
          }
          this.jumping = false;
          this.falling = false;
    
          if (!this.building) this.anims.play("playeridle", true);
        }
    
        this.body.setVelocityX(0); // Stop horizontal movement if no key is pressed
      }
    
      // Hammer blow action when spacebar is pressed
      if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) this.hammerBlow();
    
      // Build block action when down arrow or 'S' is pressed
      if (Phaser.Input.Keyboard.JustDown(this.cursor.down) || Phaser.Input.Keyboard.JustDown(this.S)) {
        this.buildBlock();
      }
    
      // Reset jump count on landing
      if (this.body.blocked.down) {
        this.jumpCount = 0; // Reset jump count when player lands
      }
    }
    

  /*
    This is called when the player hits the floor. It creates smoke particles. It reuses the jumpSmoke method.
    */
  landSmoke() {
    this.jumpSmoke(20);
  }

  jumpSmoke(offsetY = 10, varX) {
    Array(Phaser.Math.Between(3, 6))
      .fill(0)
      .forEach((i) => {
        const offset = varX || Phaser.Math.Between(-1, 1) > 0 ? 1 : -1;
        varX = varX || Phaser.Math.Between(0, 20);
        new JumpSmoke(this.scene, this.x + offset * varX, this.y + offsetY);
      });
  }

  /*
    This is called when the player generates a block. It also creates smoke particles.
    */
  buildBlock() {
    this.building = true;
    this.anims.play("playerbuild", true);
    this.scene.playAudio("build");
    const offsetX = this.right ? 64 : -64;
    const offsetY = this.jumpVelocity === -400 ? 0 : -128;
    this.buildSmoke(32, offsetX);
    this.scene.bricks.add(
      new Brick(this.scene, this.x + offsetX, this.y + offsetY)
    );
  }

  /*
    This generates the smoke particles when the player builds a block.
    */
  buildSmoke(offsetY = 10, offsetX) {
    Array(Phaser.Math.Between(8, 14))
      .fill(0)
      .forEach((i) => {
        const varX = Phaser.Math.Between(-20, 20);
        new JumpSmoke(this.scene, this.x + (offsetX + varX), this.y + offsetY);
      });
  }

  /*
    This is called when the player creates a blow to destroy something.
    */
  hammerBlow() {
    this.building = true;
    this.anims.play("playerhammer", true);
    const offsetX = this.right ? 32 : -32;
    const size = this.mjolnir ? 128 : 32;
    this.scene.blows.add(
      new Blow(this.scene, this.x + offsetX, this.y, size, size)
    );
  }

  /*
    This just turns the player in the opposite direction.
    */
  turn() {
    this.right = !this.right;
  }

  /*
    This is called when the player finishes an animation. It checks if the animation is the `playerground`, `playerhammer` or `playerbuild` and it plays the idle animation.
    */
  animationComplete(animation, frame) {
    if (animation.key === "playerground") {
      this.anims.play("playeridle", true);
    }

    if (animation.key === "playerhammer" || animation.key === "playerbuild") {
      this.building = false;
      this.anims.play(this.jumping ? "playerjump" : "playeridle", true);
    }
  }

  /*
    This is called when the player is hit by an enemy. It reduces the health and checks if the player is dead.
    */
    hit() {
      if (this.dead || this.invincible) return; // Prevent multiple hits or when invincible
      console.log("Player got hit! Health:", this.health);
      this.health--;
      console.log("Player health now:", this.health);
      if (this.health <= 0) {
        console.log("About to call die()... dead =", this.dead);
        this.die();
      } else {
        this.anims.play("playerdead", true);
        this.body.enable = false;
    
        // Optional: brief invincibility after hit
        this.invincible = true;
        this.scene.time.delayedCall(1000, () => {
          this.invincible = false;
          this.body.enable = true;
        });
    }
  }

  /*
    This is called when the player is dead. It plays the death animation and restarts the scene.
    */
    die() {
      console.log("die() called. dead =", this.dead);
      if (this.dead) return;
      console.log("Player is now dead");
      this.dead = true;
    
      this.anims.play("playerdead", true);
      this.body.immovable = true;
      this.body.moves = false;
    
      this.scene.time.delayedCall(1500, () => {
        this.scene.restartScene();
      });
    }
    

  /*
    This is called when the player picks a prize. It checks the prize and calls the corresponding method.
    */
  applyPrize(prize) {
    switch (prize) {
      case "speed":
        this.walkVelocity = 330;
        this.flashPlayer();
        break;
      case "hammer":
        this.mjolnir = true;
        this.flashPlayer();
        break;
      case "boots":
        this.jumpVelocity = -600;
        this.flashPlayer();
        break;
      case "coin":
        this.scene.updateCoins();
        break;
      case "star":
        this.invincible = true;
        this.scene.tweens.add({
          targets: this,
          duration: 300,
          alpha: { from: 0.7, to: 1 },
          repeat: -1,
        });
        break;
      default:
        break;
    }
  }

  /*
    This is called when the player picks a prize. It flashes the player to show the player that he got a prize.
    */
  flashPlayer() {
    this.scene.tweens.add({
      targets: this,
      duration: 50,
      scale: { from: 1.2, to: 1 },
      repeat: 10,
    });
  }
}

export default Player;
