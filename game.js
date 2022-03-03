'use strict'
// Calculate the pixel ratio of the screen to ensure everything is scaled correctly
const PIXEL_RATIO = (() => {
   var ctx = document.createElement("canvas").getContext("2d"),
      dpr = window.devicePixelRatio || 1,
      bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;

   return dpr / bsr;
})();

class Weapon {
   constructor(id, fireRate, projectileSpeed, damage, pierce) {
      this.id = id;
      this.fireRate = fireRate;
      this.projectileSpeed = projectileSpeed;
      this.damage = damage;
      this.pierce = pierce;
      this.fireCooldown = false;
   }
}

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
   mainWeapon: new Weapon("laser_basic", 400, -3.5, 1, 1),
   secondaryWeapon: null
};

class Timer {
   constructor(callback, delay) {
      this.callback = callback;
      this.remaining = delay;
      game.timers.push(this);
      this.start();
   }

   start() {
      this.started = new Date();
      this.id = setTimeout(() => {
         this.end();
         this.callback();
      }, this.remaining);
   }

   pause() {
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
         this.destroy("boundary");
      }
      else this.draw();
   }

   hurt(damage, source) {
      this.health -= damage;
      if (this.health <= 0) this.destroy(source);
   }

   destroy(source) {
      game.objects.remove(this);

      if (this.type !== "projectile" && isLastStageObject() && !isGameOver) finishStage()
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

   destroy(source) {
      super.destroy(source);
      if (source != "boundary") {
         this.use();
         new Timer(this.stop, this.duration);
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
   constructor(size, x, reward, dy) {
      let sizeMultiplier = Math.max(Math.pow(size - 1, 2), 1);
      super(x * PIXEL_RATIO, 0, "asteroid", sizeMultiplier);
      this.size = size;
      this.damage = sizeMultiplier;
      this.reward = reward == null ? sizeMultiplier : reward;
      this.dy = dy ?? Math.max(1 / Math.pow(2, size - 1), .12) * PIXEL_RATIO;
      this.setSize(this.size * 28, this.size * 44);
   }

   destroy(source) {
      if (source == "boundary") hurtPlayer(this.damage);
      else {
         updateHUDElem("money", this.reward);
         updateHUD();
      }
      super.destroy(source);
   }
}

class Projectile extends GameObject {
   constructor(weapon, x, y, dx, source) {
      super(x, y, "projectile", weapon.pierce);
      this.source = source;
      this.weaponID = weapon.id;
      this.damage = weapon.damage;
      this.dx = dx;
      this.dy = weapon.projectileSpeed * PIXEL_RATIO;
      this.setSize(4, 50);
      this.y = y - this.height;
   }

   create() {
      addGameObject(this);
   }

   moveObject() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.y < 0) this.destroy("boundary");
      else if (this.y + this.height > game.BOARD_HEIGHT - controls.SLIDER_SIZE) {
         this.destroy("boundary");

         if (this.source !== "player" && this.x <= controls.playerPos + currentShip.width
            && this.x + this.width >= controls.playerPos) {
               hurtPlayer(this.damage);
            }
      }
      else this.draw();
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

class ShooterObject extends GameObject {
   constructor(x, y, width, height, type, health, weapon) {
      super(x, y, type, health);
      this.setSize(width, height);
      this.weapon = weapon;
   }

   fire() {
      if (!this.weapon.fireCooldown) {
         new Projectile(this.weapon, this.x + this.width / 2, this.y + this.height, 0, this.type).create();
         this.weapon.fireCooldown = true;
         new Timer(() => this.weapon.fireCooldown = false, this.weapon.fireRate);
      }
   }
}

class UFO extends ShooterObject {
   static HOVER_HEIGHT = 300;
   static SHOOT_THRESHOLD = 10;

   constructor(x, speed, fireRate, reward) {
      let weapon = new Weapon("laser_basic", fireRate, 3.5, 1, 1);
      super(x, 0, 50, 50, "ufo", 6, weapon);
      this.reward = reward;
      this.dy = 0.5;
      this.dx = speed;
   }

   destroy(source) {
      super.destroy(source);
      if (source === "player") {
         updateHUDElem("money", this.reward);
      }
   }

   moveObject() {
      this.y += this.dy;
      this.draw();

      if (this.y > UFO.HOVER_HEIGHT) this.dy = 0;
      if (controls.playerPos > this.x) this.x += this.dx;
      else this.x -= this.dx;
      if (Math.abs(controls.playerPos - this.x) < UFO.SHOOT_THRESHOLD) this.fire();
   }
}
