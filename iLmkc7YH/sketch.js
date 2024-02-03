let currentTrainBlock = 0;
let trainBlocks = [0, 1];
let totalTrainBlocks = 1;
let max_amplitudes = [1/2, 1/4, 1/8, 1/16, 1/32, 1/64, 1/128];
let frequency = [0.1,0.25,0.55,0.85,1.15,1.55,2.05];
let frameNum = 0; // Number of frames in the current session
var timeout;
var dotX;
var dotY;
var dotV;
var dotA;
var maxX = 160;
var width_x = 24;
var scaling = 1.5;
var angAcc;
var lines;
var currentSession = 0;
var sessions = 3;
var offset;
var blockType;
var isDraw;
var path;
var dotU;
var act;
var handleMode = -1;
var locked = -1;
var h;
var maxA;
//X: +-15
//Theta: +-2rad
//AngAcc: +-4rad
var subjTrials = {
    fullname: null,
    type : -1,
    ground : [],
    states : [],
    actions : []
}
var textDesc = [
    "short testing session of normal control",
    "short testing session of reverse control",
    "training session for practising normal control",
    "training session for practising reverse control",
    "short testing session"
]
function setup() {
    isDraw = false;
    maxA = PI/2;
    h = min(windowHeight*1/6, 100);
    select('#endDiv').hide();
    select('#instrDiv').hide();
    startGame();
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    offset = 1-blockType;
    subjTrials.type = blockType;
    currentSession = 0;
    sessionInfo(0);
}
function trainBlockNext() {
    subjTrials.states.push(path);
    subjTrials.actions.push(act);
    currentSession += 1;
    if(currentSession<2)
        sessionInfo(0);
    else if(currentSession == 2)
        sessionInfo(1);
    else
        sessionInfo(2);
}
function startSession(type) {
    dotX = 0;
    dotY = 0;
    dotV = 1;
    dotA = 0;
    dotU = 0;
    angAcc = 0;
    width_x = windowWidth/2;
    isDraw = true;
    document.onclick = null;
    document.onmousemove = handleMouseMove;
    path = []; 
    act = [];
    var maxPoints = 0;
    if(type == 0)
        maxPoints = 1000;
    else if(type == 1)
        maxPoints = 10000;
    lines = sinuousCurve(maxPoints);
    subjTrials.ground.push(lines);
    clear();
    //var timer = setTimeout(trainBlockNext, type==0? 8000: 20000);
    timeout = maxPoints+60;
    frameNum = 0;
    loop();
}
function sessionInfo(type) {
    document.onmousemove = null;
    noLoop();
    handleMode = -1;
    locked = -1;
    clear();
    isdraw = false;
    let htmlDiv = select('#endDiv');
    if(type == 0) {
        offset = 1-offset;
        htmlDiv.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks+1} completed.<br>The next session is a ${textDesc[offset]}.<br>Click to continue.`);
        document.onclick = ()=>{select('#endDiv').hide();startSession(type);};
    } else if(type == 1) {
        offset = 1-offset;
        htmlDiv.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks+1} completed.<br>The next session is a ${textDesc[2+offset]}.<br>Click to continue.`);
        document.onclick = ()=>{select('#endDiv').hide();startSession(type);};
    } else if(currentTrainBlock < totalTrainBlocks){
        htmlDiv.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks+1} completed.<br>Click to proceed to next training block.`);
        document.onclick = ()=>{select('#endDiv').hide();currentTrainBlock++; trainBlockStart();};
    } else{
        htmlDiv.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks+1} completed.<br>Click to proceed.`);
        document.onclick = ()=>{select('#endDiv').hide();currentTrainBlock++; endGame();};
    }
    htmlDiv.show();
    
}
function draw() {
    if(isDraw) {
        clear();
        background('white');
        if(frameNum > timeout) {
            trainBlockNext();
            return;
        }
        translate(windowWidth/2, windowHeight*2/3 - dotY*scaling);
        dotA = fixBetween(dotA + angAcc, -maxA, +maxA);
        dotX = fixBetween(dotX + dotV*dotA, -windowWidth/3, windowWidth/3);
        dotY -= dotV;
        //bzCurve(lines, 0.3, 1);
        drawCurve(lines, int(-(dotY+windowHeight/2/scaling)), int(-(dotY-windowHeight/scaling))); //int(max(0, -(dotY+height/2)/4)), int(-(dotY-height)/4))
        stroke('blue');
        fill('blue');
        heading = atan2(dotA, 1);
        triangle(dotX*scaling, dotY*scaling, dotX*scaling-10*sin(heading)+4*cos(heading), dotY*scaling+10*cos(heading)+4*sin(heading), dotX*scaling-10*sin(heading)-4*cos(heading), dotY*scaling+10*cos(heading)-4*sin(heading));
        path.push({x:dotX, a:dotA});
        act.push(dotU);
        //drawControlBar(windowWidth/2-40, dotY*scaling);
        handleMode = isOverHandle();
        drawControlBar(0, dotY*scaling+windowHeight*1/6);
        drawAngSpeedBar(-windowWidth/2+110, dotY*scaling+windowHeight*1/6);
        drawHandleBar(windowWidth/2-110, dotY*scaling+windowHeight*1/6);
        frameNum++;
        dotU = 0;
    }
}
function gradient(a, b) { 
    return (b.y-a.y)/(b.x-a.x); 
}
function fixBetween(x, minimum, maximum) {
    if(x < minimum)
        return minimum;
    else if(x > maximum)
        return maximum;
    return x;
}
function sinuousCurve(len) {
    var points = [];
    let start = 0;
    for(let i=0; i<len; i++) {
        var X = 0;
        for(let j=0; j<max_amplitudes.length; j++) {
            X += width_x/2*max_amplitudes[j]*sin(2*PI*start*frequency[j]);
        }
        points.push({x: X, y: i});
        start += 0.01
    }
    return points;
}
function drawCurve(coords, start, end) {
    noFill();
    stroke('black');
    strokeWeight(6);
    let startFix = start;
    if(startFix < 0)
        startFix = 0;
    let endFix = end;
    if(endFix > coords.length)
        endFix = coords.length;
    for(let i = startFix+1; i<endFix; i++)
        line(coords[i-1].x*scaling, -coords[i-1].y*scaling, coords[i].x*scaling, -coords[i].y*scaling);
}
function drawControlBar(x, y) {
    fill('white');
    strokeWeight(2);
    //noStroke();
    rect(x-h, y-h/2, 2*h, h);
    noFill();
    stroke('black');
    /*line(x-h/2, y+h/5, x+h/2, y+h/5);
    line(x-h/2, y-h/5, x-h/2, y+h/5);
    line(x+h/2, y-h/5, x+h/2, y+h/5);
    line(x, y-3*h/10, x, y+3*h/10);
    stroke('blue');
    fill('blue');
    ellipse(x+dotA/maxA*h/2, y, 3*h/10, 3*h/10);*/
    line(x-h/2, y+h/10, x+h/2, y+h/10);
    line(x-h/2, y-h/10, x-h/2, y+h/10);
    line(x+h/2, y-h/10, x+h/2, y+h/10);
    line(x, y-3*h/20, x, y+3*h/20);
    stroke('blue');
    fill('blue');
    ellipse(x+dotA/maxA*h/2, y, 3*h/20, 3*h/20);
}
function drawAngSpeedBar(x, y) {
    fill('white');
    strokeWeight(2);
    rect(x-h, y-h/2, 2*h, h);
    noFill();
    stroke('black');
    line(x-h/2, y, x+h/2, y);
    line(x-h/2, y-h/10, x-h/2, y+h/10);
    line(x+h/2, y-h/10, x+h/2, y+h/10);
    line(x, y-3*h/20, x, y+3*h/20);
    stroke('blue');
    fill('blue');
    rect(x, y-h/20, angAcc/1*h/2, h/10);
}
function drawHandleBar(x, y) {
    fill('white');
    strokeWeight(2);
    //noStroke();
    rect(x-h, y-h/2, 2*h, h);
    noFill();
    stroke('black');
    line(x-h/2*cos(dotU), y-h/2*sin(dotU), x+h/2*cos(dotU), y+h/2*sin(dotU));
    strokeWeight(6);
    if(handleMode == 1)
        stroke('blue');
    else
        stroke('black');
    line(x-h/2*cos(dotU), y-h/2*sin(dotU), x-0.3*h*cos(dotU), y-0.3*h*sin(dotU));
    if(handleMode == 2)
        stroke('blue');
    else
        stroke('black');
    line(x+0.3*h*cos(dotU), y+0.3*h*sin(dotU), x+h/2*cos(dotU), y+h/2*sin(dotU));
    stroke('black');
    fill('black');
    ellipse(x, y, h/25, h/25);
}
function isOverHandle() {
    if(
        mouseX > windowWidth/2 - h/2*cos(angAcc) - 5 &&
        mouseX < windowWidth/2 - 0.3*h*cos(angAcc) + 5 &&
        mouseY > windowHeight - h/2 - h/2*sin(angAcc) - 5 &&
        mouseY < windowHeight - h/2 - 0.3*h*sin(angAcc) + 5
    )
        return 1;
    else if(
        mouseX > windowWidth/2 + 0.3*h*cos(angAcc) - 5 &&
        mouseX < windowWidth/2 + h/2*cos(angAcc) + 5 &&
        mouseY > windowHeight - h/2 + 0.3*h*sin(angAcc) - 5 &&
        mouseY < windowHeight - h/2 + h/2*sin(angAcc) + 5
    )
        return 2;
    return 0;
}
function handleMouseMove(e) {
    let scaledMovementX = e.movementX/1024;
    if(offset == 0)
        angAcc += scaledMovementX + moveNoise(currentSession);
    else
        angAcc += -scaledMovementX + moveNoise(currentSession);
    angAcc = fixBetween(angAcc, -4, +4);
}
/*function handleMouseMove(e) {
    let scaledMovementX = e.movementX;
    if(offset == 0)
        dotU += scaledMovementX * angAcc + moveNoise(currentSession);
    else
        dotU += -scaledMovementX * angAcc + moveNoise(currentSession);
    //dotA = fixBetween(dotA + dotU, -maxA, +maxA);
}*/
function handleClick() {
    startSession();
}
function moveNoise(session) {
    return 0;
}
function startGame() {
    cnv = createCanvas(windowWidth, windowHeight);
    document.body.style.overflow = 'hidden';
    //fullscreen(true);
    trainBlockStart();

}
// Function that ends the game appropriately after the experiment has been completed
function endGame() {
    cnv.hide();
    //fullscreen(false);
    document.body.style.overflow = 'auto';
}