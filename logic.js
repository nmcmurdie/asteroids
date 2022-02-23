'use strict'
var gameLoop, currentStage, stageFinished = false;

window.addEventListener("load", () => {
   let board = document.getElementById("game_map");
   game.BOARD_WIDTH = board.clientWidth;
   game.BOARD_HEIGHT = board.clientHeight;
   controls.playerPos = game.BOARD_WIDTH / 2;

   updateHUD();
   updateSliderPos(true);
   gameLoop = setInterval(tick, game.TICK_SPEED);
   startLevel(game.levels[game.currentLevel]);
});

window.addEventListener("keydown", handleKeypress);
window.addEventListener("keyup", handleKeypress);

Array.prototype.remove = function() {
   let what, a = arguments, L = a.length, ax;
   while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
         this.splice(ax, 1);
      }
   }
   return this;
}

function handleKeypress(evt) {
   let moveResult = (evt.type === "keydown");

   switch (evt.key) {
      case "ArrowLeft":
      case "a":
      case "A":
         controls.holdingLeft = moveResult;
         break;
      case "ArrowRight":
      case "d":
      case "D":
         controls.holdingRight = moveResult;
         break;
      case " ":
         controls.holdingFire = moveResult;
         break;
      case "Shift":
         controls.holdingSecondaryFire = moveResult;
         break;
   }
}

function tick() {
   if (controls.holdingLeft || controls.holdingRight) updateSliderPos(controls.holdingLeft);
   if (controls.holdingFire) fireWeapon(currentShip.mainWeapon);
   if (controls.holdingSecondaryFire) fireWeapon(currentShip.secondaryWeapon);
   let projectiles = [];

   for (let i = 0; i < game.objects.length; ++i) {
      let obj = game.objects[i];
      if (obj.type === "projectile") {
         projectiles.push(obj);
      }
      obj.moveObject();
   }

   for (let i = 0; i < projectiles.length; ++i) {
      let proj = projectiles[i];

      for (let j = 0; j < game.objects.length; ++j) {
         let obj = game.objects[j];

         if (obj !== proj && obj.type !== "projectile" && colliding(proj, obj)) {
            proj.hurt(obj.damage == null ? 1 : obj.damage);
            obj.hurt(proj.damage);
         }
      }
   }
}

function startLevel(level) {
   console.log("Starting level: ", level);
   level.start();
   beginStage(level.advanceStage());
}

function beginStage(stage) {
   console.log("Starting stage: ", stage);
   currentStage = stage;
   stageFinished = false;
   let objectDuration = stage.time / stage.objects.length;

   createStageObject(0, objectDuration);
}

function createStageObject(index, timeout) {
   if (index == currentStage.objects.length - 1) stageFinished = true;
   let obj = currentStage.objects[index];
   obj.create();

   if (index + 1 < currentStage.objects.length) {
      setTimeout(() => createStageObject(index + 1, timeout), timeout);
   }
}

function isLastStageObject() {
   let lastObj = true;
   for (let i = 0; i < game.objects.length; ++i) {
      if (game.objects[i].type !== "projectile") lastObj = false;
   }
   return lastObj && stageFinished;
}

function finishStage() {
   console.log("Finishing stage");
   let currentLevel = game.levels[game.currentLevel];
   if (currentLevel.hasNextStage()) beginStage(currentLevel.advanceStage());
   else finishLevel(currentLevel);
}

function finishLevel(level) {
   console.log("Finished level");
   if (game.currentLevel + 1 < game.levels.length) {
      startLevel(game.levels[++game.currentLevel]);
      console.log("Starting new level");
   }
   else {
      console.log("GAME_WON");
   }
}

function colliding(obj1, obj2) {
   let rect1 = obj1.elem.getBoundingClientRect(),
      rect2 = obj2.elem.getBoundingClientRect();
   return rect1.top <= rect2.bottom
         && rect1.bottom >= rect2.top
         && rect1.left <= rect2.right
         && rect1.right >= rect2.left;
}

function updateHUD() {
   document.getElementById("hud_health").textContent = game.health;
   document.getElementById("hud_money").textContent = game.money;

   let shieldHUD = document.getElementById("hud_shield");
   if (game.shield > 0) shieldHUD.style.display = "inline-block";
   else shieldHUD.style.display = "none";

   shieldHUD.textContent = game.shield;
}

function addShield(shield) {
   game.shield += shield;
   updateHUD();
}

function updateSliderPos(moveLeft) {
   controls.playerPos = moveLeft ? Math.max(controls.playerPos - currentShip.speed, controls.SLIDER_SIZE / 2 - currentShip.widthPadding)
                                 : Math.min(controls.playerPos + currentShip.speed, game.BOARD_WIDTH - controls.SLIDER_SIZE / 2 + currentShip.widthPadding);

   document.getElementById("game_shooter").style.left = controls.playerPos + "px";
}

function addGameObject(elem, object) {
   document.getElementById("game_map").appendChild(elem);
   game.objects.push(object);
}

function fireWeapon(weapon) {
   if (!weapon || weapon.fireCooldown) return;
   weapon.fireCooldown = true;
   new Projectile(weapon, controls.playerPos, game.BOARD_HEIGHT, 0, "player").create();

   setTimeout(() => weapon.fireCooldown = false, weapon.fireRate);
}

function animateDamage(shieldDamage) {
   let pane = document.getElementById("pane_main");
   if (shieldDamage) pane.classList.add("damage-shield");
   else pane.classList.remove("damage-shield");

   pane.classList.add("animate");
   setTimeout(() => pane.classList.remove("animate"), 400);
}

function hurtPlayer(damage) {
   let computedDamage = damage;
   if (game.shield >= 0) {
      computedDamage = Math.max(damage - game.shield, 0);
      game.shield = Math.max(game.shield - damage, 0);
   }
   animateDamage(computedDamage === 0);

   game.health = Math.max(game.health - computedDamage, 0);
   if (game.health === 0) {
      clearInterval(gameLoop);
      console.log("GAME_OVER");
   }
   updateHUD();
}
