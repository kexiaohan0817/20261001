// 宣告氣球陣列，用來存放所有氣球
let balloons = [];

// 宣告爆破粒子陣列，用來存放所有爆破粒子
let particles = [];

// 宣告 Web Audio API 音訊環境
let audioContext = null;

// 記錄音效是否開啟
let soundEnabled = true;

// 記錄音效是否已經初始化
let audioInitialized = false;

// 宣告音效開關按鈕
let soundButton;

// 設定氣球總數量
const BALLOON_COUNT = 25;

// 設定每次爆破的氣球數量
const BURST_COUNT = 2;

// 設定爆破間隔時間
const BURST_INTERVAL = 1000;

// 設定氣球顏色清單
const BALLOON_COLORS = [
  "#ffadad",
  "#ffd6a5",
  "#fdffb6",
  "#caffbf",
  "#9bf6ff",
  "#a0c4ff",
  "#bdb2ff",
  "#ffc6ff",
  "#fffffc"
];

// 記錄上一次爆破時間
let lastBurstTime = 0;

// p5.js 初始化函式
function setup() {
  // 建立符合視窗大小的畫布
  createCanvas(windowWidth, windowHeight);

  // 建立音效開關按鈕
  soundButton = createButton("音效：開");

  // 設定按鈕的 HTML 類別
  soundButton.class("sound-button");

  // 設定按鈕的位置
  soundButton.position(20, 20);

  // 設定按鈕的滑鼠點擊事件
  soundButton.mousePressed(toggleSound);

  // 建立 25 顆氣球
  for (let i = 0; i < BALLOON_COUNT; i++) {
    // 建立氣球並加入氣球陣列
    balloons.push(new Balloon(i));
  }

  // 記錄初始時間
  lastBurstTime = millis();
}

// p5.js 主繪圖函式
function draw() {
  // 重新繪製背景
  background("#caf0f8");

  // 取得目前時間
  const currentTime = millis();

  // 判斷是否經過一秒
  if (currentTime - lastBurstTime >= BURST_INTERVAL) {
    // 爆破兩顆氣球
    burstTwoBalloons();

    // 更新上一次爆破時間
    lastBurstTime = currentTime;
  }

  // 更新並繪製所有氣球
  for (let i = 0; i < balloons.length; i++) {
    // 更新氣球位置
    balloons[i].update();

    // 繪製氣球
    balloons[i].display();
  }

  // 從後往前更新爆破粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    // 更新粒子
    particles[i].update();

    // 繪製粒子
    particles[i].display();

    // 移除已經消失的粒子
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }
}

// 當視窗大小改變時執行
function windowResized() {
  // 重新設定畫布大小
  resizeCanvas(windowWidth, windowHeight);
}

// 切換音效開關
function toggleSound() {
  // 反轉音效開關狀態
  soundEnabled = !soundEnabled;

  // 更新按鈕文字
  soundButton.html(soundEnabled ? "音效：開" : "音效：關");

  // 當音效開啟時初始化音訊
  if (soundEnabled) {
    // 初始化音訊環境
    enableAudio();
  }
}

// 初始化 Web Audio API
function enableAudio() {
  // 如果音訊已初始化就不重複建立
  if (audioInitialized) {
    // 如果音訊處於暫停狀態就恢復播放
    if (audioContext && audioContext.state === "suspended") {
      // 恢復音訊環境
      audioContext.resume();
    }

    // 結束函式
    return;
  }

  // 取得瀏覽器支援的 AudioContext
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  // 如果瀏覽器不支援音訊就結束
  if (!AudioContextClass) {
    // 關閉音效狀態
    soundEnabled = false;

    // 更新按鈕文字
    soundButton.html("音效：不可用");

    // 結束函式
    return;
  }

  // 建立音訊環境
  audioContext = new AudioContextClass();

  // 設定音訊已初始化
  audioInitialized = true;

  // 如果瀏覽器暫停音訊就恢復
  if (audioContext.state === "suspended") {
    // 恢復音訊環境
    audioContext.resume();
  }
}

// 播放爆破音效
function playPopSound() {
  // 如果音效關閉或音訊尚未初始化就不播放
  if (!soundEnabled || !audioInitialized || !audioContext) {
    // 結束函式
    return;
  }

  // 如果音訊處於暫停狀態就不播放
  if (audioContext.state === "suspended") {
    // 嘗試恢復音訊環境
    audioContext.resume();
  }

  // 取得音效開始時間
  const startTime = audioContext.currentTime;

  // 建立振盪器
  const oscillator = audioContext.createOscillator();

  // 建立音量控制器
  const gainNode = audioContext.createGain();

  // 建立低通濾波器
  const filterNode = audioContext.createBiquadFilter();

  // 設定振盪器波形
  oscillator.type = "sine";

  // 設定起始頻率
  oscillator.frequency.setValueAtTime(260, startTime);

  // 讓頻率快速下降
  oscillator.frequency.exponentialRampToValueAtTime(
    75,
    startTime + 0.16
  );

  // 設定濾波器類型
  filterNode.type = "lowpass";

  // 設定濾波器起始頻率
  filterNode.frequency.setValueAtTime(1200, startTime);

  // 讓濾波器頻率下降
  filterNode.frequency.exponentialRampToValueAtTime(
    250,
    startTime + 0.16
  );

  // 設定初始音量
  gainNode.gain.setValueAtTime(0.0001, startTime);

  // 快速提高音量
  gainNode.gain.exponentialRampToValueAtTime(
    0.28,
    startTime + 0.012
  );

  // 讓音量快速降低
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + 0.18
  );

  // 連接振盪器與濾波器
  oscillator.connect(filterNode);

  // 連接濾波器與音量控制器
  filterNode.connect(gainNode);

  // 連接音量控制器與喇叭
  gainNode.connect(audioContext.destination);

  // 開始播放聲音
  oscillator.start(startTime);

  // 停止播放聲音
  oscillator.stop(startTime + 0.2);
}

// 每秒爆破兩顆氣球
function burstTwoBalloons() {
  // 建立可選取的氣球索引
  let availableIndexes = [];

  // 將所有氣球索引加入清單
  for (let i = 0; i < balloons.length; i++) {
    // 儲存氣球索引
    availableIndexes.push(i);
  }

  // 重複爆破兩顆氣球
  for (let i = 0; i < BURST_COUNT; i++) {
    // 隨機選取索引位置
    const randomListIndex = floor(random(availableIndexes.length));

    // 取得氣球索引
    const balloonIndex = availableIndexes[randomListIndex];

    // 移除已選取的索引
    availableIndexes.splice(randomListIndex, 1);

    // 取得選中的氣球
    const balloon = balloons[balloonIndex];

    // 建立爆破效果
    balloon.createBurstEffect();

    // 播放爆破音效
    playPopSound();

    // 將爆破後的氣球重設到視窗下方
    balloon.reset();
  }
}

// 建立氣球類別
class Balloon {
  // 建立氣球初始資料
  constructor(index) {
    // 儲存氣球編號
    this.index = index;

    // 設定氣球水平位置
    this.x = random(width);

    // 設定氣球垂直位置
    this.y = random(height + 50, height + 300);

    // 設定氣球寬度
    this.width = random(150, 250);

    // 設定氣球高度
    this.height = this.width * random(1.1, 1.35);

    // 設定氣球顏色
    this.color = color(random(BALLOON_COLORS));

    // 設定氣球透明度
    this.alpha = random(80, 100);

    // 套用透明度
    this.color.setAlpha(this.alpha);

    // 設定氣球速度
    this.speed = random(3, 8);

    // 設定左右搖晃幅度
    this.swayAmount = random(0.8, 2.5);

    // 設定左右搖晃速度
    this.swaySpeed = random(0.01, 0.035);

    // 設定左右搖晃相位
    this.swayOffset = random(TWO_PI);

    // 記錄初始水平位置
    this.startX = this.x;

    // 設定旋轉角度
    this.rotation = random(-0.12, 0.12);

    // 設定旋轉速度
    this.rotationSpeed = random(-0.0015, 0.0015);

    // 設定星星數量
    this.starCount = floor(random(2, 5));

    // 建立星星陣列
    this.stars = [];

    // 建立星星
    this.createStars();
  }

  // 建立氣球上的星星
  createStars() {
    // 清空星星陣列
    this.stars = [];

    // 建立多顆星星
    for (let i = 0; i < this.starCount; i++) {
      // 設定星星水平位置比例
      const normalizedX = random(-0.28, 0.28);

      // 設定星星垂直位置比例
      const normalizedY = random(-0.32, 0.32);

      // 設定星星大小
      const starSize = min(
        random(this.width * 0.045, this.width * 0.08),
        this.width * 0.08
      );

      // 儲存星星資料
      this.stars.push({
        // 設定星星水平位置
        x: normalizedX * this.width,

        // 設定星星垂直位置
        y: normalizedY * this.height,

        // 設定星星尺寸
        size: starSize,

        // 設定星星旋轉角度
        rotation: random(-PI, PI)
      });
    }
  }

  // 更新氣球位置
  update() {
    // 讓氣球向上移動
    this.y -= this.speed;

    // 讓氣球左右搖晃
    this.x =
      this.startX +
      sin(frameCount * this.swaySpeed + this.swayOffset) *
        this.swayAmount *
        20;

    // 讓氣球緩慢旋轉
    this.rotation += this.rotationSpeed;

    // 當氣球飄出畫布上方時重設
    if (this.y + this.height / 2 < 0) {
      // 重設氣球資料
      this.reset();
    }
  }

  // 重設氣球
  reset() {
    // 設定新的水平位置
    this.x = random(width);

    // 設定新的垂直位置
    this.y = height + random(50, 250);

    // 記錄新的起始水平位置
    this.startX = this.x;

    // 設定新的寬度
    this.width = random(150, 250);

    // 設定新的高度
    this.height = this.width * random(1.1, 1.35);

    // 設定新的顏色
    this.color = color(random(BALLOON_COLORS));

    // 設定新的透明度
    this.alpha = random(80, 100);

    // 套用新的透明度
    this.color.setAlpha(this.alpha);

    // 設定新的速度
    this.speed = random(3, 8);

    // 設定新的左右搖晃幅度
    this.swayAmount = random(0.8, 2.5);

    // 設定新的左右搖晃速度
    this.swaySpeed = random(0.01, 0.035);

    // 設定新的左右搖晃相位
    this.swayOffset = random(TWO_PI);

    // 設定新的旋轉角度
    this.rotation = random(-0.12, 0.12);

    // 設定新的旋轉速度
    this.rotationSpeed = random(-0.0015, 0.0015);

    // 設定新的星星數量
    this.starCount = floor(random(2, 5));

    // 重新建立星星
    this.createStars();
  }

  // 建立爆破效果
  createBurstEffect() {
    // 設定爆破粒子數量
    const particleCount = 32;

    // 建立爆破粒子
    for (let i = 0; i < particleCount; i++) {
      // 設定粒子爆散角度
      const angle = TWO_PI * i / particleCount + random(-0.15, 0.15);

      // 設定粒子爆散速度
      const speed = random(2, 7);

      // 建立粒子
      particles.push(
        new BurstParticle(
          this.x,
          this.y,
          cos(angle) * speed,
          sin(angle) * speed,
          this.color
        )
      );
    }

    // 建立爆破閃光
    particles.push(new BurstFlash(this.x, this.y, this.width));
  }

  // 繪製氣球
  display() {
    // 儲存目前繪圖狀態
    push();

    // 移動到氣球位置
    translate(this.x, this.y);

    // 套用旋轉角度
    rotate(this.rotation);

    // 設定氣球填滿顏色
    fill(this.color);

    // 設定氣球外框顏色
    stroke(255, 255, 255, this.alpha);

    // 設定外框粗細
    strokeWeight(2);

    // 繪製橢圓形氣球
    ellipse(0, 0, this.width, this.height);

    // 設定星星顏色
    fill(255, 255, 255, 190);

    // 移除星星外框
    noStroke();

    // 繪製所有星星
    for (let i = 0; i < this.stars.length; i++) {
      // 儲存星星繪圖設定
      push();

      // 移動到星星位置
      translate(this.stars[i].x, this.stars[i].y);

      // 套用星星旋轉角度
      rotate(this.stars[i].rotation);

      // 繪製星星
      this.drawStar(
        0,
        0,
        this.stars[i].size * 0.45,
        this.stars[i].size,
        5
      );

      // 還原星星繪圖設定
      pop();
    }

    // 設定尾部結填滿顏色
    fill(this.color);

    // 設定尾部結外框顏色
    stroke(255, 255, 255, this.alpha);

    // 設定尾部結外框粗細
    strokeWeight(1.5);

    // 繪製尾部結
    triangle(
      -this.width * 0.055,
      this.height * 0.45,
      this.width * 0.055,
      this.height * 0.45,
      0,
      this.height * 0.56
    );

    // 設定細繩顏色
    stroke(90, 90, 110, this.alpha);

    // 設定細繩粗細
    strokeWeight(1.5);

    // 移除細繩填滿色
    noFill();

    // 開始繪製細繩
    beginShape();

    // 設定細繩起點
    vertex(0, this.height * 0.55);

    // 設定細繩第二個點
    vertex(-8, this.height * 0.72);

    // 設定細繩第三個點
    vertex(7, this.height * 0.88);

    // 設定細繩終點
    vertex(-4, this.height * 1.05);

    // 結束繪製細繩
    endShape();

    // 設定高光顏色
    fill(255, 255, 255, 45);

    // 移除高光外框
    noStroke();

    // 繪製高光
    ellipse(
      -this.width * 0.2,
      -this.height * 0.2,
      this.width * 0.16,
      this.height * 0.28
    );

    // 還原繪圖狀態
    pop();
  }

  // 繪製五角星
  drawStar(x, y, innerRadius, outerRadius, points) {
    // 設定星星角度間隔
    const angle = TWO_PI / points;

    // 設定內外角之間的半角
    const halfAngle = angle / 2;

    // 開始繪製星星
    beginShape();

    // 逐步繪製星星頂點
    for (let i = 0; i < TWO_PI; i += angle) {
      // 計算外側頂點水平位置
      const outerX = x + cos(i - HALF_PI) * outerRadius;

      // 計算外側頂點垂直位置
      const outerY = y + sin(i - HALF_PI) * outerRadius;

      // 加入外側頂點
      vertex(outerX, outerY);

      // 計算內側頂點水平位置
      const innerX = x + cos(i + halfAngle - HALF_PI) * innerRadius;

      // 計算內側頂點垂直位置
      const innerY = y + sin(i + halfAngle - HALF_PI) * innerRadius;

      // 加入內側頂點
      vertex(innerX, innerY);
    }

    // 封閉星星
    endShape(CLOSE);
  }
}

// 建立爆破粒子類別
class BurstParticle {
  // 設定爆破粒子初始資料
  constructor(x, y, velocityX, velocityY, particleColor) {
    // 設定粒子水平位置
    this.x = x;

    // 設定粒子垂直位置
    this.y = y;

    // 設定粒子水平速度
    this.velocityX = velocityX;

    // 設定粒子垂直速度
    this.velocityY = velocityY;

    // 儲存粒子顏色
    this.particleColor = particleColor;

    // 設定粒子生命值
    this.life = 255;

    // 設定粒子大小
    this.size = random(5, 12);

    // 設定粒子旋轉角度
    this.rotation = random(TWO_PI);

    // 設定粒子旋轉速度
    this.rotationSpeed = random(-0.15, 0.15);

    // 隨機設定粒子形狀
    this.shape = random() < 0.5 ? "circle" : "star";
  }

  // 更新爆破粒子
  update() {
    // 更新粒子水平位置
    this.x += this.velocityX;

    // 更新粒子垂直位置
    this.y += this.velocityY;

    // 加入重力效果
    this.velocityY += 0.12;

    // 讓水平速度逐漸減少
    this.velocityX *= 0.985;

    // 更新粒子旋轉
    this.rotation += this.rotationSpeed;

    // 讓粒子逐漸消失
    this.life -= 5;
  }

  // 繪製爆破粒子
  display() {
    // 儲存繪圖狀態
    push();

    // 移動到粒子位置
    translate(this.x, this.y);

    // 套用粒子旋轉
    rotate(this.rotation);

    // 設定粒子顏色與透明度
    fill(
      red(this.particleColor),
      green(this.particleColor),
      blue(this.particleColor),
      this.life
    );

    // 移除粒子外框
    noStroke();

    // 繪製圓形或星形粒子
    if (this.shape === "circle") {
      // 繪製圓形粒子
      ellipse(0, 0, this.size, this.size);
    } else {
      // 繪製星形粒子
      drawParticleStar(0, 0, this.size * 0.4, this.size, 5);
    }

    // 還原繪圖狀態
    pop();
  }

  // 判斷粒子是否已經消失
  isFinished() {
    // 回傳粒子是否已經完成淡出
    return this.life <= 0;
  }
}

// 建立爆破閃光類別
class BurstFlash {
  // 設定爆破閃光初始資料
  constructor(x, y, balloonWidth) {
    // 設定閃光水平位置
    this.x = x;

    // 設定閃光垂直位置
    this.y = y;

    // 設定閃光大小
    this.size = balloonWidth * 0.15;

    // 設定閃光生命值
    this.life = 255;
  }

  // 更新閃光效果
  update() {
    // 讓閃光逐漸變大
    this.size += 12;

    // 讓閃光逐漸消失
    this.life -= 18;
  }

  // 繪製閃光效果
  display() {
    // 儲存繪圖狀態
    push();

    // 移動到閃光位置
    translate(this.x, this.y);

    // 設定閃光顏色與透明度
    fill(255, 255, 255, this.life);

    // 移除閃光外框
    noStroke();

    // 繪製閃光圓形
    ellipse(0, 0, this.size, this.size);

    // 還原繪圖狀態
    pop();
  }

  // 判斷閃光是否已經消失
  isFinished() {
    // 回傳閃光是否完成淡出
    return this.life <= 0;
  }
}

// 繪製爆破星星粒子
function drawParticleStar(x, y, innerRadius, outerRadius, points) {
  // 設定星星角度間隔
  const angle = TWO_PI / points;

  // 設定星星內外角半角
  const halfAngle = angle / 2;

  // 開始繪製星星
  beginShape();

  // 建立星星頂點
  for (let i = 0; i < TWO_PI; i += angle) {
    // 計算外側頂點水平座標
    const outerX = x + cos(i - HALF_PI) * outerRadius;

    // 計算外側頂點垂直座標
    const outerY = y + sin(i - HALF_PI) * outerRadius;

    // 加入外側頂點
    vertex(outerX, outerY);

    // 計算內側頂點水平座標
    const innerX = x + cos(i + halfAngle - HALF_PI) * innerRadius;

    // 計算內側頂點垂直座標
    const innerY = y + sin(i + halfAngle - HALF_PI) * innerRadius;

    // 加入內側頂點
    vertex(innerX, innerY);
  }

  // 封閉星星形狀
  endShape(CLOSE);
}