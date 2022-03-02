'use strict'
// Calculate the pixel ratio of the screen to ensure everything is scaled correctly
const PIXEL_RATIO = (function () {
   var ctx = document.createElement("canvas").getContext("2d"),
      dpr = window.devicePixelRatio || 1,
      bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;

   return dpr / bsr;
})();

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
   timers: [],
   currentLevel: 0,
   levelFinished: false
};
const controls = {
   SLIDER_SIZE: 80 * PIXEL_RATIO,
   holdingLeft: false,
   holdingRight: false,
   holdingFire: false,
   holdingSecondaryFire: false,
   playerPos: 0
};
const currentShip = {
   speed: 1.5 * PIXEL_RATIO,
   width: 56 * PIXEL_RATIO,
   height: 60 * PIXEL_RATIO,
   icon: "rocket_basic",
   mainWeapon: {
      id: "laser_basic",
      fireRate: 400,
      fireCooldown: false,
      projectileSpeed: 3.5,
      damage: 1,
      pierce: 1
   },
   secondaryWeapon: null
};

class Timer {
   constructor(callback, delay) {
      this.callback = callback;
      this.delay = delay;
      this.running = false;
      this.remaining = delay;

      this.start();
   }

   start() {
      this.running = true;
      this.started = new Date();
      this.id = setTimeout(() => {
         this.end();
         this.callback();
      }, this.remaining);
   }

   pause() {
      this.running = false;
      clearTimeout(this.id);
      this.remaining -= new Date() - this.started;
   }

   end() {
      game.timers.remove(this);
   }
}

class GameObject {
   constructor(x, y, type, health) {
      this.x = x;
      this.y = y;
      this.setSize(0, 0);
      this.health = health;
      this.type = type;
      this.dx = 0;
      this.id = Math.random().toString(16).slice(2);
   }

   setSize(width, height) {
      this.width = width * PIXEL_RATIO;
      this.height = height * PIXEL_RATIO;
   }

   getAsset() {
      if (this.asset) return this.asset;
      else {
         let assetPath = `res/${this.type}.png`;
         this.asset = new Image();
         this.asset.src = assetPath;
         return this.asset;
      }
   }

   create() {
      this.getAsset();
      addGameObject(this);
   }

   draw() {
      getCanvas().drawImage(this.getAsset(), this.x, this.y - this.height, this.width, this.height);
   }

   moveObject() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.y > game.BOARD_HEIGHT - controls.SLIDER_SIZE || this.y < 0) {
         this.destroy(true);
      }
      else this.draw();
   }

   hurt(damage) {
      this.health -= damage;
      if (this.health <= 0) this.destroy(false);
   }

   destroy(hitBoundary) {
      game.objects.remove(this);

      if (this.type !== "projectile" && isLastStageObject() && !gameOver) finishStage()
   }
}

class BoosterItem extends GameObject {
   static BOOST_SHORT = 500;
   static BOOST_MEDIUM = 1000;
   static BOOST_LONG = 3000;

   constructor(x, y, type, duration) {
      super(x, y, type, 1);
      this.duration = duration;
      this.dy = 0.5 * PIXEL_RATIO;
   }

   destroy(hitBoundary) {
      super.destroy(hitBoundary);
      if (!hitBoundary) {
         this.use();
         game.timers.push(new Timer(this.stop, this.duration));
      }
   }
}

class GunBoost extends BoosterItem {
   constructor(x) {
      super(x, 0, "gunBoost", BoosterItem.BOOST_LONG);
      this.setSize(39, 45);
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
      super(x * PIXEL_RATIO, 0, "asteroid", sizeMultiplier);
      this.size = size;
      this.damage = sizeMultiplier;
      this.reward = reward == null ? sizeMultiplier : reward;
      this.dy = Math.max(1 / Math.pow(2, size - 1), .12) * PIXEL_RATIO;
      this.setSize(this.size * 28, this.size * 44);
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
      this.dy = -1 * weapon.projectileSpeed * PIXEL_RATIO;
      this.setSize(4, 50);
      this.y = y - this.height;
   }

   create() {
      addGameObject(this);
   }

   draw() {
      switch (this.weaponID) {
         case "laser_basic":
            getCanvas().fillStyle = "green";
            getCanvas().fillRect(this.x, this.y, this.width, this.height);
            break;
         case "laser_advanced":
            getCanvas().fillStyle = "red";
            getCanvas().fillRect(this.x, this.y, this.width, this.height);
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
