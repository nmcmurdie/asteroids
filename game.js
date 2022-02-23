'use strict'
const game = {
   BOARD_WIDTH: 0,
   BOARD_HEIGHT: 0,
   TICK_SPEED: 5,
   health: 10,
   money: 0,
   score: 0,
   shield: 0,
   objects: [],
   levels: [],
   currentLevel: 0,
   levelFinished: false
};
const controls = {
   SLIDER_SIZE: 80,
   holdingLeft: false,
   holdingRight: false,
   holdingFire: false,
   holdingSecondaryFire: false,
   playerPos: 0
};
const currentShip = {
   widthPadding: 12,
   speed: 2,
   mainWeapon: {
      id: "laser_basic",
      fireRate: 400,
      fireCooldown: false,
      projectileSpeed: 4,
      damage: 1,
      pierce: 1
   },
   secondaryWeapon: null
};

class GameObject {
   constructor(x, y, type, health) {
      this.x = x;
      this.y = y;
      this.health = health;
      this.type = type;
      this.dx = 0;
      this.id = Math.random().toString(16).slice(2);
   }

   create() {
      this.elem = document.createElement("div");
      this.elem.classList.add("game-object", this.type);
      this.elem.id = this.id;

      this.moveObject(this.elem, this);
      addGameObject(this.elem, this);
   }

   moveObject() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.y > game.BOARD_HEIGHT || this.y < 0) {
         this.destroy(true);
      }
      else {
         this.elem.style.left = this.x + "px";
         this.elem.style.top = this.y + "px";
      }
   }

   hurt(damage) {
      this.health -= damage;
      if (this.health <= 0) this.destroy(false);
   }

   destroy(hitBoundary) {
      this.elem.remove();
      game.objects.remove(this);

      if (this.type !== "projectile" && isLastStageObject()) finishStage()
   }
}

class BoosterItem extends GameObject {
   static BOOST_SHORT = 500;
   static BOOST_MEDIUM = 1000;
   static BOOST_LONG = 3000;

   constructor(x, y, type, duration) {
      super(x, y, type, 1);
      this.duration = duration;
      this.dy = 1;
   }

   destroy(hitBoundary) {
      super.destroy(hitBoundary);
      if (!hitBoundary) {
         this.use();
         setTimeout(this.stop, this.duration);
      }
   }
}

class GunBoost extends BoosterItem {
   constructor(x) {
      super(x, 0, "gunBoost", BoosterItem.BOOST_LONG);
   }

   use() {
      this.oldFireRate = currentShip.mainWeapon.fireRate;
      currentShip.mainWeapon.fireRate -= 300;
   }

   stop() {
      currentShip.mainWeapon.fireRate += 300;
   }
}

class Asteroid extends GameObject {
   constructor(size, x, reward) {
      let sizeMultiplier = Math.max(Math.pow(size - 1, 2), 1);
      super(x, 0, "asteroid", sizeMultiplier);
      this.size = size;
      this.damage = sizeMultiplier;
      this.reward = reward == null ? sizeMultiplier : reward;
      this.dy = Math.max(1 / Math.pow(2, size - 1), .12);
   }

   create() {
      super.create();
      this.elem.style.width = this.size * 28 + "px";
      this.elem.style.height = this.size * 44 + "px";
   }

   destroy(hitBoundary) {
      if (hitBoundary) hurtPlayer(this.damage);
      else {
         game.money += this.reward;
         updateHUD();
      }
      super.destroy(hitBoundary);
   }
}

class Projectile extends GameObject {
   constructor(weapon, x, y, dx, source) {
      super(x, y, "projectile", weapon.pierce);
      this.source = source;
      this.weaponID = weapon.id;
      this.damage = weapon.damage;
      this.dx = dx;
      this.dy = -1 * weapon.projectileSpeed;
   }

   create() {
      super.create();

      switch (this.weaponID) {
         case "laser_basic":
            this.elem.classList.add("projectile-laser");
            break;
         case "laser_advanced":
            this.elem.classList.add("projectile-laser", "laser-advanced");
            break;
         default:
            console.error("Unknown projectile type");
      }
   }
}

class Level {
   constructor(stages, icon, background) {
      this.stage = -1;
      this.totalStages = stages.length;
      this.stages = stages;
      this.icon = icon;
      this.background = background;
   }

   advanceStage() {
      if (this.stage >= this.totalStages) return;
      console.log("Moving from stage " + this.stage + " to stage " + (this.stage + 1));
      return this.stages[++this.stage];
   }

   hasNextStage() {
      return this.stage + 1 < this.totalStages;
   }

   start() {
      document.getElementById("hud_level").style.backgroundImage = `url(res/${this.icon})`;
      document.getElementById("pane_main").style.background = `linear-gradient(to bottom, ${this.background[0]} 0%, ${this.background[1]} 80%, ${this.background[2]})`;
   }
}

class EarthLevel extends Level {
   constructor() {
      let stages = [
         {
            time: 8_000,
            objects: [new Asteroid(2, 100), new Asteroid(2, 400), new Asteroid(2, 50), new Asteroid(2, 300), new Asteroid(4, 200)]
         },
         {
            time: 5_000,
            objects: [new Asteroid(3, 100), new Asteroid(2, 200), new Asteroid(3, 300), new Asteroid(2, 400), new Asteroid(2, 400)]
         },
         {
            time: 5_000,
            objects: [new GunBoost(280), new Asteroid(2, 140), new Asteroid(2, 260), new Asteroid(1, 320), new Asteroid(2, 60), new Asteroid(2, 120), new Asteroid(1, 300), new Asteroid(2, 160), new Asteroid(1, 400)]
         },
         {
            time: 2_000,
            objects: [new Asteroid(2, 0), new Asteroid(2, 380), new Asteroid(2, 70), new Asteroid(2, 20), new Asteroid(2, 420), new Asteroid(2, 200), new Asteroid(2, 120), new Asteroid(2, 330), new Asteroid(2, 30)]
         },
         {
            time: 7_000,
            objects: [new Asteroid(5, 200), new Asteroid(1, 40), new Asteroid(1, 100), new Asteroid(1, 300), new Asteroid(1, 80), new Asteroid(1, 260), new Asteroid(1, 340)]
         },
         {
            time: 20_000,
            objects: [new Asteroid(8, 200, 50), new Asteroid(1, 350), new Asteroid(1, 300), new Asteroid(1, 400), new Asteroid(1, 50), new Asteroid(1, 400)]
         }
      ];
      super(stages, "earth.png", ["#00004B", "#1A237E", "#283593"]);
   }
}

class MoonLevel extends Level {
   constructor() {
      let stages = [
         {
            time: 1_000,
            objects: [new GunBoost(200)]
         }
      ];
      super(stages, "moon.png", ["#000000", "#12121f", "#1c1c2c"]);
   }
}

game.levels = [ new EarthLevel(), new MoonLevel() ];
