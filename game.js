const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const joystickCanvas = document.getElementById('joystick');
const jctx = joystickCanvas.getContext('2d');
const insertBtn = document.getElementById('insertCoin');
const dropBtn = document.getElementById('dropButton');
const modal = document.getElementById('modal');
const prizeImg = document.getElementById('prizeImg');
const closeModal = document.getElementById('closeModal');

let gameState = 'waiting'; // waiting, playing
let claw = { x: canvas.width/2, y: 50, width: 40, height: 20, state:'idle', grabbed:null };
let toys = [];

// create simple pixel-art sprites for the claw in open and closed states
function createClawSprites() {
  function draw(open = true) {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 40;
    const cx = c.getContext('2d');
    cx.strokeStyle = '#fff';
    cx.lineWidth = 4;
    cx.lineCap = 'round';
    if (open) {
      // arms open in a V shape
      cx.beginPath();
      cx.moveTo(20, 0);
      cx.lineTo(5, 25);
      cx.moveTo(20, 0);
      cx.lineTo(35, 25);
      cx.stroke();
    } else {
      // arms closed almost parallel
      cx.beginPath();
      cx.moveTo(18, 0);
      cx.lineTo(14, 25);
      cx.moveTo(22, 0);
      cx.lineTo(26, 25);
      cx.stroke();
    }
    return c.toDataURL();
  }

  const openImg = new Image();
  openImg.src = draw(true);
  const closedImg = new Image();
  closedImg.src = draw(false);
  return { open: openImg, closed: closedImg };
}

const clawSprites = createClawSprites();

function randomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
}

function initToys() {
  toys = [];
  for (let i=0; i<5; i++) {
    const color = randomColor();
    toys.push({
      x: 60 + i*80,
      y: canvas.height-60,
      size: 40,
      color,
      sprite: generateToySprite(color),
      grabbed: false
    });
  }
}

function resetGame() {
  gameState = 'waiting';
  claw = { x: canvas.width/2, y: 50, width:40, height:20, state:'idle', grabbed:null };
  initToys();
  dropBtn.disabled = true;
  // ensure the win modal is hidden when restarting
  modal.classList.add('hidden');
  modal.style.display = 'none';
  prizeImg.src = '';
  prizeImg.style.backgroundColor = '';
}

resetGame();

// joystick
const joy = { cx:50, cy:50, r:40, active:false, knobX:0 };

function drawJoystick() {
  jctx.clearRect(0,0,joystickCanvas.width, joystickCanvas.height);
  jctx.fillStyle = '#444';
  jctx.beginPath();
  jctx.arc(joy.cx, joy.cy, joy.r, 0, Math.PI*2);
  jctx.fill();
  jctx.fillStyle = '#888';
  jctx.beginPath();
  jctx.arc(joy.cx + joy.knobX, joy.cy, 15, 0, Math.PI*2);
  jctx.fill();
}

drawJoystick();

joystickCanvas.addEventListener('mousedown', (e)=>{
  joy.active = true;
  updateJoy(e);
});

joystickCanvas.addEventListener('mousemove', (e)=>{
  if(joy.active) updateJoy(e);
});

window.addEventListener('mouseup', ()=>{
  joy.active = false;
  joy.knobX = 0;
});

function updateJoy(e) {
  const rect = joystickCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  joy.knobX = Math.max(-joy.r, Math.min(joy.r, x - joy.cx));
}

// draw a simple teddy bear-like toy
function drawToy(toy, context = ctx) {
  const { x, y, size, color } = toy;
  const c = context;
  c.fillStyle = color;

  // body
  c.beginPath();
  c.arc(x, y, size / 2, 0, Math.PI * 2);
  c.fill();

  // head
  c.beginPath();
  c.arc(x, y - size * 0.7, size / 2.5, 0, Math.PI * 2);
  c.fill();

  // ears
  c.beginPath();
  c.arc(x - size / 3, y - size * 0.95, size / 6, 0, Math.PI * 2);
  c.arc(x + size / 3, y - size * 0.95, size / 6, 0, Math.PI * 2);
  c.fill();

  // arms
  c.beginPath();
  c.arc(x - size / 1.8, y, size / 5, 0, Math.PI * 2);
  c.arc(x + size / 1.8, y, size / 5, 0, Math.PI * 2);
  c.fill();

  // legs
  c.beginPath();
  c.arc(x - size / 3, y + size / 1.2, size / 4, 0, Math.PI * 2);
  c.arc(x + size / 3, y + size / 1.2, size / 4, 0, Math.PI * 2);
  c.fill();

  // face
  c.fillStyle = '#000';
  c.beginPath();
  c.arc(x - size / 8, y - size * 0.75, size / 15, 0, Math.PI * 2); // left eye
  c.arc(x + size / 8, y - size * 0.75, size / 15, 0, Math.PI * 2); // right eye
  c.fill();

  c.beginPath();
  c.arc(x, y - size * 0.65, size / 15, 0, Math.PI * 2); // nose
  c.fill();
}

function generateToySprite(color) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const cx = c.getContext('2d');
  drawToy({ x: 32, y: 32, size: 32, color }, cx);
  return c.toDataURL();
}

function drawMachine() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // machine outline
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(40,20,400,600);

  // drop hole
  ctx.fillStyle = '#000';
  ctx.fillRect(360,560,60,40);

  // toys
  for (const toy of toys) {
    if(!toy.grabbed || toy === claw.grabbed) {
      drawToy(toy);
    }
  }

  // claw
  ctx.fillStyle = '#ccc';
  ctx.fillRect(claw.x - 2, 20, 4, claw.y - 20); // arm
  const sprite = (claw.grabbed) ? clawSprites.closed : clawSprites.open;
  ctx.drawImage(sprite, claw.x - sprite.width / 2, claw.y);
}

function update() {
  if(gameState === 'playing') {
    if(claw.state === 'idle') {
      claw.x += (joy.knobX/joy.r) * 2;
      claw.x = Math.max(60, Math.min(canvas.width-60, claw.x));
    } else if(claw.state === 'dropping') {
      claw.y += 4;
      if(claw.y > 500) {
        checkGrab();
        claw.state = 'up';
      }
    } else if(claw.state === 'up') {
      claw.y -= 4;
      if(claw.grabbed) {
        claw.grabbed.x = claw.x;
        claw.grabbed.y = claw.y + claw.height/2 + 15;
      }
      if(claw.y <= 50) {
        if(claw.grabbed) {
          claw.state = 'carry';
        } else {
          claw.state = 'idle';
          dropBtn.disabled = false;
        }
      }
    } else if(claw.state === 'carry') {
      if(claw.x < 390) {
        claw.x +=2;
        claw.grabbed.x = claw.x;
        claw.grabbed.y = claw.y + claw.height/2 + 15;
      } else {
        claw.state = 'release';
      }
    } else if(claw.state === 'release') {
      claw.grabbed.y += 5;
      if(claw.grabbed.y > 560) {
        gameState = 'won';
        prizeImg.src = claw.grabbed.sprite;
        prizeImg.style.backgroundColor = '';
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
      }
    }
  }
  drawMachine();
  drawJoystick();
  requestAnimationFrame(update);
}

function checkGrab() {
  for(const toy of toys) {
    if(!toy.grabbed) {
      const dist = Math.abs(toy.x - claw.x);
      if(dist < 20) {
        toy.grabbed = true;
        claw.grabbed = toy;
        break;
      }
    }
  }
}

update();

insertBtn.addEventListener('click', () => {
  if(gameState === 'waiting') {
    gameState = 'playing';
    dropBtn.disabled = false;
  }
});

dropBtn.addEventListener('click', () => {
  if(claw.state === 'idle') {
    claw.state = 'dropping';
    dropBtn.disabled = true;
  }
});

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
  modal.style.display = 'none';
  resetGame();
});
