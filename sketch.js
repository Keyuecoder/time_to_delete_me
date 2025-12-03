let cracks = [];
let bgImg;
let crackSpots = [];
let crackSound;

let cam;
let camW = 350;
let camH = 200;

let randomWeight = 0;
let lastUpdateTime = 0;

let blurOffUntil = 0;

// zoom 弹窗
let zoomImg;

// 🍔🍟🍰 粒子
let emojiParticles = [];
let emojiList = ["🍔", "🍟", "🍰", "🍕","🥞","🍩"];

// === 大笑脸控制变量 ===
let bigFaceEmoji = "";
let bigFaceTimer = 0;

function preload() {
  cracks[0] = loadImage('Crack.png');
  cracks[1] = loadImage('Crack2.png');
  bgImg = loadImage('desk5.png');
  crackSound = loadSound('Crack sound.mp3');
  zoomImg = loadImage('zoom.jpeg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  cam = createCapture(VIDEO);
  cam.size(camW, camH);
  cam.hide();

  randomWeight = int(random(45, 101));
}

function draw() {
  image(bgImg, width / 2, height / 2, windowWidth, windowHeight);

  // ===== glitch（保留但降低红色）=====
  if (random() < 0.02) {
    push();
    let glitchX = int(random(-10, 10));
    let glitchY = int(random(-10, 10));
    let w = int(random(50, 200));
    let h = int(random(10, 50));
    let sx = int(random(0, bgImg.width - w));
    let sy = int(random(0, bgImg.height - h));

    copy(bgImg, sx, sy, w, h, sx + glitchX, sy + glitchY, w, h);

    tint(255, 40); 
    image(bgImg, width/2, height/2, windowWidth, windowHeight);
    noTint();
    pop();
  }

  // ===== 裂纹 (修改点：时间变短，透明度降低) =====
  let now = millis();
  // 1. 修改：时间从 10000 改为 3000 (3秒)
  crackSpots = crackSpots.filter(c => now - c.time < 3000); 
  
  for (let c of crackSpots) {
    push();
    translate(c.x, c.y);
    rotate(c.angle);
    
    // 2. 修改：设置透明度 (255 * 0.6 ≈ 153)
    tint(255, 153); 
    image(c.img, 0, 0, 100, 170); // 尺寸如果你之前改过，保持你想要的尺寸
    noTint();
    
    pop();
  }

  // ===== emoji 粒子 =====
  updateEmojiParticles();

  // ===== 摄像头显示 =====
  push();
  let x = width - camW / 2 - 150;
  let y = height / 2 + 100;

  noStroke();
  fill(0, 100);
  rectMode(CENTER);
  rect(x, y, camW + 10, camH + 10, 10);

  let disableEffects = millis() < blurOffUntil;

  // 模糊控制
  if (disableEffects) {
    image(cam, x, y, camW, camH);
  } else {
    let blurred = cam.get();
    blurred.filter(BLUR, 3);
    image(blurred, x, y, camW, camH);
  }
  
  // === 大笑脸遮挡 (2秒消失) ===
  if (millis() < bigFaceTimer) {
      push();
      textAlign(RIGHT, CENTER);
      textSize(130); 
      text(bigFaceEmoji, x, y); 
      pop();
  }

  // ===== zoom 顶部 =====
  if (zoomImg) {
    let zoomW = camW;
    let zoomH = zoomImg.height * (zoomW / zoomImg.width);
    image(zoomImg, x, y - camH / 2 + zoomH / 2, zoomW, zoomH);
  }

  // ===== 数字 & 干扰线 =====
  if (!disableEffects) {
    if (millis() - lastUpdateTime > 1000) {
      randomWeight = int(random(45, 101));
      lastUpdateTime = millis();
    }

    push();
    textAlign(CENTER, CENTER);
    textSize(36);
    fill(255, 200);  
    text(randomWeight, x, y);
    pop();

    noStroke();
    for (let i = 0; i < 2; i++) { 
      if (random() < 0.15) {
        fill(255, 150);  
        let lineY = y - camH / 2 + random(camH);
        let lineH = random(2, 6);
        rectMode(CENTER);
        rect(x, lineY, camW, lineH);
      }
    }
  }

  pop();
}


// ====== 触摸 ======
function touchStarted() {
  if (touches.length > 0) {
    let tx = touches[0].x;
    let ty = touches[0].y;

    let randomCrack = random(cracks);
    let randomAngle = random(TWO_PI);

    crackSpots.push({
      x: tx,
      y: ty,
      img: randomCrack,
      angle: randomAngle,
      time: millis()
    });

    if (crackSound) crackSound.play();

    // 3. 修改：一次生成多个粒子 (5 到 10 个随机)
    let burstCount = int(random(2, 5));
    for (let i = 0; i < burstCount; i++) {
        spawnEmoji(tx, ty);
    }
    
    // === 触发大笑脸 ===
    bigFaceEmoji = random(["😃", "😆"]);
    bigFaceTimer = millis() + 2000; 
  }

  blurOffUntil = millis() + 5000;
  return false;
}


// ====== emoji 粒子 ======
function spawnEmoji(x, y) {
  let e = {
    x: x,
    y: y,
    // 4. 修改：增大速度范围，让它们爆开得更散
    vx: random(-8, 8),      
    vy: random(-12, -4),    
    gravity: 0.8,           
    emoji: random(emojiList)
  };
  emojiParticles.push(e);
}

function updateEmojiParticles() {
  for (let i = 0; i < emojiParticles.length; i++) {
    let p = emojiParticles[i];

    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    
    // === 地面碰撞与堆积逻辑 ===
    // 5. 修改：因为粒子变大了，稍微调高地面检测线，防止穿模
    let groundLevel = height - 40; 
    
    if (p.y > groundLevel) {
        p.y = groundLevel;       
        p.vy *= -0.5;            
        p.vx *= 0.8;             
        
        if (abs(p.vy) < 1) p.vy = 0;
        if (abs(p.vx) < 0.1) p.vx = 0;
    }

    push();
    textAlign(CENTER, CENTER);
    // 6. 修改：稍微放大粒子尺寸
    textSize(45); 
    fill(255); 
    text(p.emoji, p.x, p.y);
    pop();
  }
}