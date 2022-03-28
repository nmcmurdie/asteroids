'use strict'
const SHOP_BG_COLOR = "#300060";
var gameLoop, currentStage, hitControlThreshold, moveControlThreshold, canvas, map, mapWidth, mapHeight;
var stageFinished = false, isGameOver = false, isGamePaused = true;

// Determine if user is on a mobile device
function isMobile() {
   let check = false;
   (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
   return check;
};

const isLandscape = () => screen.availWidth > screen.availHeight;

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

// Setup game
window.addEventListener("load", () => {
   controls.playerPos = game.BOARD_WIDTH / 2;

   if (isMobile()) detectMobile();
   updateHUD();
   updateShip();
   setupCanvas();
   startGame();
   startLevel(game.levels[game.currentLevel]);
   addClickListeners();
   window.requestAnimationFrame(drawFrame);
});

window.addEventListener("keydown", handleKeypress);
window.addEventListener("keyup", handleKeypress);
window.addEventListener("orientationchange", changeOrientation);
window.addEventListener("gesturestart", e => e.preventDefault());

function addClickListeners() {
   document.getElementById("shop_continue").addEventListener("click", closeShop);
}

// Handle mobile user changing orientation
function changeOrientation() {
   if (isLandscape()) {
      alert("Please rotate screen to portrait mode");
      pauseGame();
   }
   else if(!isGameOver) startGame();
}

// Setup the game canvas
function setupCanvas() {
   canvas = document.getElementById("game_canvas");
   let container = document.getElementById("game_map");

   canvas.width = PIXEL_RATIO * container.clientWidth;
   canvas.height = PIXEL_RATIO * container.clientHeight;
   canvas.style.width = container.clientWidth + "px";
   canvas.style.height = container.clientHeight + "px";
   mapWidth = canvas.width;
   mapHeight = canvas.height;
   
   map = canvas.getContext("2d");
   map.imageSmoothingEnabled = false;

   game.BOARD_WIDTH = canvas.width;
   game.BOARD_HEIGHT = canvas.height;
   controls.playerPos = (canvas.width - currentShip.width) / 2;
}

// Get the game map, used by game objects
function getCanvas() {
   return map;
}

// Enable mobile controls
function detectMobile() {
   let mobileControls = document.getElementById("mobile_controls");
   mobileControls.classList.remove("hidden");

   document.getElementById("text_fire").textContent = "FIRE"

   hitControlThreshold = mobileControls.clientWidth / 3;
   moveControlThreshold = mobileControls.clientWidth / 1.5;

   mobileControls.addEventListener("touchstart", processMovement, { passive: true });
   mobileControls.addEventListener("touchmove", processMovement, { passive: true });
   mobileControls.addEventListener("touchend", processMovement, { passive: true });
}

const changeStatusBarColor = color => {
   if (isMobile()) document.querySelector('meta[name=theme-color]').content = color
};

const addShopItem = (category, container, object, index) => {
   const item = createShopItem(object, category, index);
   container.appendChild(item);
};

function openShop() {
   const shopContainer = document.getElementById("shop"),
         powerupContainer = document.getElementById("shop_powerups"),
         weaponContainer = document.getElementById("shop_weapons"),
         starshipContainer = document.getElementById("shop_starships");

   pauseGame();

   while (powerupContainer.firstChild) powerupContainer.firstChild.remove();
   while (weaponContainer.firstChild) weaponContainer.firstChild.remove();
   while (starshipContainer.firstChild) starshipContainer.firstChild.remove();
   
   shop.powerups.forEach((obj, i) => addShopItem("powerups", powerupContainer, obj, i));
   shop.weapons.forEach((obj, i) => addShopItem("weapons", weaponContainer, obj, i));
   shop.starships.forEach((obj, i) => addShopItem("starships", starshipContainer, obj, i));

   shopContainer.classList.add("visible");
   changeStatusBarColor(SHOP_BG_COLOR);
}

function closeShop() {
   const shopContainer = document.getElementById("shop");
   shopContainer.classList.remove("visible");
   const currentLevel = game.levels[game.currentLevel];
   currentLevel.setStatusColor();
   startGame();
}

function createShopItem(powerup, category, index) {
   let name = powerup.getName(), img = powerup.getAsset(), cost = powerup.getCost();
   let container = document.createElement('div'),
         item = document.createElement('div');
   container.classList.add("shop-item-container");

   item.classList.add("shop-item");
   img.classList.add("shop-item-img");
   item.appendChild(img);
   item.setAttribute("name", name);

   let btn = createShopButton(category, index, cost, !powerup.canAfford());
   
   container.appendChild(item);
   container.appendChild(btn);
   
   return container;
}

// Create a 'buy' button for a shop item
function createShopButton(category, index, cost, disabled) {
   let btn = document.createElement('div');
   btn.classList.add("shop-button", "shop-buy");
   btn.setAttribute("category", category);
   btn.setAttribute("index", index);

   btn.addEventListener("click", evt => {
      let category = evt.target.getAttribute('category'),
         index = evt.target.getAttribute('index');
      shop[category][+index].buy();
      openShop();
   });

   if (disabled) btn.classList.add("disabled");

   let btn_img = new Image(),
      btn_text = document.createElement('span');

   btn_img.src = "res/money.png";
   btn_img.classList.add("shop-button-icon");

   btn.appendChild(btn_img);
   btn_text.appendChild(document.createTextNode(cost));
   btn.appendChild(btn_text);
   return btn;
}

function toggleFireHint(hint) {
   let fireHint = document.getElementById("start_game"),
      fireText = document.getElementById("desc_fire"),
      hud = document.getElementById("hud");
   if (!hint) {
      fireHint.classList.remove("visible");
      hud.classList.add("visible");
   }
   else {
      fireText.textContent = hint;
      fireHint.classList.add("visible");
   }
}

// Move shooter left or right depending on touch position on controls
function processMovement(evt) {
   let touches = evt.touches;
   controls.holdingFire = false;
   controls.holdingLeft = false;
   controls.holdingRight = false;

   for (let i = 0; i < touches.length; i++) {
      let touchX = touches[i].clientX;
      
      if (touchX < hitControlThreshold) controls.holdingFire = true;
      else if (touchX < moveControlThreshold) controls.holdingLeft = true;
      else if (touchX >= moveControlThreshold) controls.holdingRight = true;
   }
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

// Pause the game loop and associated timers
function pauseGame() {
   clearInterval(gameLoop);
   game.timers.forEach(timer => timer.pause());
   isGamePaused = true;
}

// Resume playback of the game and associated timers
function startGame() {
   if (isGamePaused && !(isLandscape() && isMobile())) {
      gameLoop = setInterval(tick, game.TICK_SPEED);
      game.timers.forEach(timer => timer.start());
      isGamePaused = false;
   }
}

// End the game once user has died
function endGame() {
   pauseGame();
   isGameOver = true;
   alert("GAME OVER!");
}

// Draw each frame, synchronized to the display graphics
function drawFrame() {
   map.clearRect(0, 0, mapWidth, mapHeight);
   game.objects.forEach(obj => obj.draw());

   map.shadowColor = "rgba(0, 0, 0, .3)";
   map.shadowBlur = 10;
   map.shadowOffsetY = 5;
   map.drawImage(currentShip.asset, controls.playerPos, game.BOARD_HEIGHT - controls.SLIDER_SIZE, currentShip.width, currentShip.height);
   map.shadowColor = "transparent";

   window.requestAnimationFrame(drawFrame);
}

// Perform game logic at a faster rate than drawing
function tick() {
   if (controls.holdingLeft || controls.holdingRight) updateSliderPos(controls.holdingLeft);
   if (controls.holdingFire) fireWeapon(currentShip.mainWeapon);
   if (controls.holdingSecondaryFire) fireWeapon(currentShip.secondaryWeapon);

   game.objects.forEach(obj => {
      obj.moveObject();
      if (obj instanceof SpinningObject) obj.rotate();
   });

   for (let i = 0; i < game.projectiles.length; ++i) {
      let proj = game.projectiles[i];
      if (proj.source !== "player") continue;

      for (let j = 0; j < game.objects.length; ++j) {
         let obj = game.objects[j];

         if (obj !== proj && obj.type !== "projectile" && colliding(proj, obj)) {
            proj.hurt(obj.damage == null ? 1 : obj.damage, obj.type);
            obj.hurt(proj.damage, proj.source);
         }
      }
   }
}

function startLevel(level) {
   level.start();
   beginStage(level.advanceStage());
}

function beginStage(stage) {
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
      new Timer(() => createStageObject(index + 1, timeout), timeout);
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
   let currentLevel = game.levels[game.currentLevel];
   if (currentLevel.hasNextStage()) beginStage(currentLevel.advanceStage());
   else finishLevel(currentLevel);
}

function finishLevel() {
   if (game.currentLevel + 1 < game.levels.length) {
      startLevel(game.levels[++game.currentLevel]);
   }
   else {
      console.log("GAME WON!");
   }
}

function colliding(obj1, obj2) {
   return obj1.y >= obj2.y - obj2.height
          && obj1.y <= obj2.y
          && obj1.x <= obj2.x + obj2.width
          && obj1.x + obj1.width >= obj2.x;
}

function updateHUD() {
   document.getElementById("hud_health").textContent = game.health;
   document.getElementById("hud_money").textContent = game.money;

   let shieldHUD = document.getElementById("hud_shield");
   if (game.shield > 0) shieldHUD.style.display = "inline-block";
   else shieldHUD.style.display = "none";

   shieldHUD.textContent = game.shield;
}

// Increment HUD element by value unless setValue, then simply set HUD element to value
function updateHUDElem(elem, value, setValue) {
   let hudElem = document.getElementById(`hud_${elem}`);
   game[elem] = setValue ? value : game[elem] + value;
   game.health = Math.min(game.health, game.MAX_HEALTH);
   updateHUD();

   hudElem.classList.add("hud-animate");
   setTimeout(() => hudElem.classList.remove("hud-animate"), 400);
}

function addShield(shield) {
   game.shield += shield;
   updateHUD();
}

// Retrieve new asset for player's ship
function updateShip() {
   currentShip.asset = new Image();
   currentShip.asset.src = `res/${currentShip.icon}.png`;
   currentShip.asset.onload = () => updateSliderPos(true);
}

// Move the player's ship left or right
function updateSliderPos(moveLeft) {
   if (moveLeft) {
      controls.playerPos = Math.max(controls.playerPos - currentShip.speed, 0);
   }
   else {
      controls.playerPos = Math.min(controls.playerPos + currentShip.speed, game.BOARD_WIDTH - currentShip.width);
   }
}

function addGameObject(object) {
   object.draw();
   game.objects.push(object);
}

function fireWeapon(weapon) {
   if (!weapon || weapon.fireCooldown) return;
   weapon.fireCooldown = true;

   new Projectile(weapon, controls.playerPos + Math.min(currentShip.width / 2), game.BOARD_HEIGHT - controls.SLIDER_SIZE, 0, "player").create();
   new Timer(() => weapon.fireCooldown = false, weapon.fireRate);
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
      updateHUDElem("shield", Math.max(game.shield - damage, 0), true);
   }

   animateDamage(computedDamage === 0);
   if (computedDamage) {
      if (navigator.vibrate) navigator.vibrate(40);
      updateHUDElem("health", Math.max(game.health - computedDamage, 0), true);
   }

   if (game.health === 0) endGame();
   updateHUD();
}
