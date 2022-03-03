'use strict'
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
             objects: [new Asteroid(2, 86), new Asteroid(2, 372), new Asteroid(2, 12), new Asteroid(2, 272), new Asteroid(4, 144)]
          },
          {
             time: 5_000,
             objects: [new Asteroid(3, 58), new Asteroid(2, 172), new Asteroid(3, 258), new Asteroid(2, 372), new Asteroid(2, 372)]
          },
          {
             time: 5_000,
             objects: [new GunBoost(260), new Asteroid(2, 112), new Asteroid(2, 232), new Asteroid(1, 306), new Asteroid(2, 32), new Asteroid(2, 92), new Asteroid(1, 286), new Asteroid(2, 132), new Asteroid(1, 386)]
          },
          {
             time: 2_000,
             objects: [new Asteroid(2, -28), new Asteroid(2, 352), new Asteroid(2, 42), new Asteroid(2, -8), new Asteroid(2, 392), new Asteroid(2, 172), new Asteroid(2, 92), new Asteroid(2, 302), new Asteroid(2, 2)]
          },
          {
             time: 7_000,
             objects: [new Asteroid(5, 130), new Asteroid(1, 26), new Asteroid(1, 86), new Asteroid(1, 286), new Asteroid(1, 66), new Asteroid(1, 246), new Asteroid(1, 326)]
          },
          {
             time: 20_000,
             objects: [new Asteroid(8, 88, 50), new Asteroid(1, 336), new Asteroid(1, 286), new Asteroid(1, 386), new Asteroid(1, 36), new Asteroid(1, 386)]
          }
       ];
       super(stages, "earth.png", ["#00004B", "#1A237E", "#283593"]);
    }
 }
 
 class MoonLevel extends Level {
    constructor() {
       let stages = [
          {
             time: 4_000,
             objects: [new Asteroid(3, 50), new Asteroid(3, 200, null, 2)]
          },
          {
             time: 1_000,
             objects: [new UFO(100, 0.75, 300, 30)]
          },
          {
             time: 6_000,
             objects: [new Asteroid(5, 250), new Asteroid(3, 50, null, 2), new Asteroid(3, 200, null, 2)]
          },
          {
             time: 12_000,
             objects: [new UFO(400, 1.5, 300, 100), new Asteroid(3, 100, null, 2), new Asteroid(3, 300, null, 2), new Asteroid(3, 200, null, 2)]
          }
       ];
       super(stages, "moon.png", ["#000000", "#12121f", "#1c1c2c"]);
    }
 }
 
 game.levels = [  new EarthLevel(), new MoonLevel() ];