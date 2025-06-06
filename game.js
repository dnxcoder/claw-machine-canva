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

function randomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
}

function initToys() {
  toys = [];
  for (let i=0; i<5; i++) {
    toys.push({
      x: 60 + i*80,
      y: canvas.height-60,
      size: 30,
      color: randomColor(),
      grabbed: false
    });
  }
}

function resetGame() {
  gameState = 'waiting';
  claw = { x: canvas.width/2, y: 50, width:40, height:20, state:'idle', grabbed:null };
  initToys();
  dropBtn.disabled = true;
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
    if(!toy.grabbed) {
      ctx.fillStyle = toy.color;
      ctx.fillRect(toy.x- toy.size/2, toy.y- toy.size/2, toy.size, toy.size);
    }
  }

  // claw
  ctx.fillStyle = '#ccc';
  ctx.fillRect(claw.x - claw.width/2, 20, 4, claw.y-20); // arm
  ctx.fillStyle = '#fff';
  ctx.fillRect(claw.x - claw.width/2, claw.y, claw.width, claw.height);
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
        prizeImg.style.background = claw.grabbed.color;
        modal.classList.remove('hidden');
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
  resetGame();
});
