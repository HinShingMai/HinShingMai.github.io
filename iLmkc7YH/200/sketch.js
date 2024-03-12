let cnv;
let currentTrainBlock = 0;
let trainBlocks = [0, 1];
let totalTrainBlocks;
let max_amplitudes = [1/2, 1/4, 1/8, 1/16, 1/32, 1/64, 1/128];
let frequency = [0.1,0.25,0.55,0.85,1.15,1.55,2.05];
let frameNum = 0; // Number of frames in the current session
var timeout;
var dotX;
var dotY;
var dotV = [0.1, 1.00];
var dotA;
var maxX;
var width_x = 24;
var scaling = 1.5;
var scaling_x;
var scaling_y;
var angAcc;
var lines;
var currentSession = 0;
var sessions = 3;
var offset;
var blockType;
var isDraw;
var dis;
var ang;
var act;
var h;
var maxA;
var maxPoints;
var time;
var fps;
var error;
var susE;
var goodjob;
var noiseM;
var subjTrials = {
    fullname: null,
    blocks : []
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
    //select('#endDiv').hide();
    //select('#instrDiv').hide();
    //cursor_img = loadImage('./cursor1.png');
    //startGame();
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    offset = 0;
    currentSession = 0;
    sessionInfo(0);
}
function sessionNext() {
    //subjTrials.blocks.push({session: [currentTrainBlock, currentSession], mod:blockType, dis:dis, ang:ang, act:act, gnd:lines});
    //recordTrialSession(trialcollection, {session: [currentTrainBlock, currentSession], mod:blockType, dis:dis, ang:ang, act:act, gnd:lines})
    document.exitPointerLock();
    currentSession += 1;
    if(currentSession<2) {
        offset = 1-offset;
        sessionInfo(0);
    }
    else if(currentSession == 2) {
        offset = blockType%2;
        sessionInfo(1);
    }
    else
        sessionInfo(2);
}
function startSession(type) {
    // Test
    //e = window.event;
    //mouseXOffset = e.clientX;
    //mouseYOffset = e.clientY;
    
    dotX = 0;
    dotY = 0;
    dotA = 0;
    angAcc = 0;
    dotU =0;
    //width_x = 240;
    maxX = width_x*0.625; //15
    isDraw = true;
    select('#container-exp').show()
    //document.getElementById("container-exp").onmousemove = handleMouseMove;
    //document.getElementById("container-exp").requestPointerLock();
    dis = []; 
    ang = [];
    act = [];
    maxPoints = 0;
    if(type == 0)
        maxPoints = 1000; //1000
    else if(type == 1)
        maxPoints = 10000; //10000
    if(blockType < 2)
        lines = sinuousCurve(maxPoints);
    else
        lines = straightLine(maxPoints);
    clear();
    timeout = maxPoints+60;
    frameNum = 0;
    error = 0.0;
    susE = 0;
    goodjob = 0;
    noiseM = 0.0;
    loop();
}
function sessionInfo(type) {
    noLoop();
    clear();
    isdraw = false;
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    let plot = select('#plot');
    if(currentSession > 0) {
        console.log("Average error: " + avgError(dis, lines));
        // Define Data
        const idx = Array.from(Array(maxPoints).keys());
        let data = [
          {x: idx, y: lines, mode:"lines", line: {color: 'black', width: 3}, name: "Path"},
          {x: idx, y: dis, mode:"lines", line: {color: 'blue', width: 3}, name: "You"},
        ];
        // Display using Plotly
        Plotly.newPlot("plot", data, {title: "Trajectory"}, {responsive: true});
        plot.show();
    } else
        plot.hide();
    select('#container-exp').hide()
    document.getElementById("container-exp").onmousemove = null;
    let button = document.getElementById("startBt");
    if(type == 0) {
        instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>The next session is a ${textDesc[offset]}.<br>Click the Continue button to proceed.`);
        button.onclick = ()=>{select('#endDiv').hide();startSession(type);};
    } else if(type == 1) {
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>The next session is a ${textDesc[2+offset]}.<br>Click the Continue button to proceed.`);
            button.onclick = ()=>{select('#endDiv').hide();startSession(type);};
    } 
    else { 
        if(currentTrainBlock+1 < totalTrainBlocks){
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Click the Continue button to proceed to next training block.`);
            button.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else{
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Click the Continue button to proceed.`);
            button.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; endGame();};//select('#endDiv').hide();
        }
    }
    htmlDiv.show();
    
}
function draw() {
    if(isDraw) {
        clear();
        background('white');
        if(frameNum > timeout) {
            sessionNext();
            return;
        }
        h = min(windowHeight*1/6, 100);
        scaling_x = max(windowWidth, 1200)/60;
        scaling_y = windowHeight/600;
        translate(windowWidth/2, windowHeight*2/3 - dotY*scaling*scaling_y);
        if(offset == 0)
            dotU = fixBetween(angAcc, -maxA, +maxA);
        else
            dotU = fixBetween(-angAcc, -maxA, +maxA);
        //dotA = fixBetween(dotA + dotV[0]*dotU + moveNoise(blockType), -maxA*dotV[0], +maxA*dotV[0]);
        //dotX = fixBetween(dotX + dotA, -maxX, maxX);
        dotA = fixBetween(dotA + dotU + moveNoise(blockType), -maxA, +maxA);
        dotX = fixBetween(dotX + dotV[0]*dotA, -maxX, maxX);
        dotY -= dotV[1];
        drawCurve(lines, int(-(dotY+windowHeight/2/scaling/scaling_y)), int(-(dotY-windowHeight/scaling/scaling_y))); //int(max(0, -(dotY+height/2)/4)), int(-(dotY-height)/4))
        heading = dotA;//atan2(dotA, 1);
        //triangle(dotX*scaling*scaling_x, dotY*scaling*scaling_y, dotX*scaling*scaling_x-10*sin(heading)+4*cos(heading), dotY*scaling*scaling_y+10*cos(heading)+4*sin(heading), dotX*scaling*scaling_x-10*sin(heading)-4*cos(heading), dotY*scaling*scaling_y+10*cos(heading)-4*sin(heading));
        if(frameNum < maxPoints) {
            dis.push(dotX);
            ang.push(dotA);
            act.push(angAcc);
            error += pow(dotX - lines[frameNum], 2);
        }
        drawBike();
        //drawControlBar(0, dotY*scaling*scaling_y+windowHeight*1/6);
        /*if(windowWidth > 6*h + 50) {
          drawAngSpeedBar(-2*h-20, dotY*scaling*scaling_y+windowHeight*1/6);
          drawHeadingBar(2*h+20, dotY*scaling*scaling_y+windowHeight*1/6);
        }*/
        drawErrorPanel(windowWidth/2-h-60, dotY*scaling*scaling_y-windowHeight*2/3+60);
        frameNum++;
    }
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
        //points.push({x: X, y: i});
        points.push(X);
        start += 0.01; // 0.02
    }
    return points;
}
function straightLine(len) {
    var points = [];
    let start = 0;
    for(let i=0; i<len; i++) {
        points.push(0.0);
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
        line(coords[i-1]*scaling*scaling_x, -(i-1)*scaling*scaling_y, coords[i]*scaling*scaling_x, -i*scaling*scaling_y);
        //line(coords[i-1].x*scaling*scaling_x, -coords[i-1].y*scaling*scaling_y, coords[i].x*scaling*scaling_x, -coords[i].y*scaling*scaling_y);
}
function drawHeadingBar(x, y) {
    fill('white');
    stroke('black');
    strokeWeight(2);
    rect(x-h, y-h/2, 2*h, h);
    noFill();
    stroke('black');
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
    stroke('black');
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
    rect(x, y-h/20, fixBetween(dotU/maxA*8*h/2, -h/2, h/2), h/10);
}
function drawErrorPanel(x, y) {
    if(frameNum%10 == 0)
        fps = int(getFrameRate());
    fill('white');
    stroke('black');
    strokeWeight(2);
    rect(x-h, y-h/2, 2*h, h);
    noFill();
    textSize(h*3/20);
    strokeWeight(1);
    let avgE = error/min(frameNum+1, maxPoints);
    text("FPS: " + fps, x-h*3/4, y-h/4);
    text("Avg Error: " + avgE.toFixed(2), x-h*3/4, y);
    if(frameNum < maxPoints) {
        let curE = pow(dotX - lines[frameNum], 2);
        if(curE < avgE*0.8) {
            fill('green');
            susE += 1;
        }
        else if(curE > avgE*1.2) {
            fill('red');
            susE -= 1;
        }
        susE = fixBetween(susE, 0, 120);
        text("Error: " + curE.toFixed(2), x-h*3/4, y+h/4)
        if(goodjob > 0) {
            text("Error: " + curE.toFixed(2) + " Good Job!", dotX*scaling*scaling_x + 60, dotY*scaling*scaling_y);
            /*if(frameNum%20 == 0) {
                confetti({ startVelocity: 30, spread: 360,  zIndex: 0, particleCount: 20, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ startVelocity: 30, spread: 360,  zIndex: 0, particleCount: 20, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }*/
            if(susE < 60) {
                goodjob = 0;
                susE = 0;
            }
        }
        else {
            text("Error: " + curE.toFixed(2), dotX*scaling*scaling_x + 60, dotY*scaling*scaling_y);
            if(susE > 60) {
                goodjob = 1;
                susE = 120;
                //confetti({particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
        }
    }
}
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}
function drawControlBar(x, y) {
    let ang = angAcc * 5;
    fill('white');
    //stroke('blue');
    strokeWeight(2);
    rect(x-h, y-h/2, 2*h, h);
    noFill();
    stroke('black');
    line(x-h/2*cos(ang), y-h/2*sin(ang), x+h/2*cos(ang), y+h/2*sin(ang));
    strokeWeight(6);
    line(x-h/2*cos(ang), y-h/2*sin(ang), x-0.3*h*cos(ang), y-0.3*h*sin(ang));
    line(x+0.3*h*cos(ang), y+0.3*h*sin(ang), x+h/2*cos(ang), y+h/2*sin(ang));
    stroke('black');
    fill('black');
    ellipse(x, y, h/25, h/25);
  
    image(cursor_img, x+0.4*h*cos(ang)-16, y+0.4*h*sin(ang)-16, 32, 32);
}
function drawBike() {
    if(offset == 0) {
        stroke('blue');
        fill('blue');
    } else {
        stroke('red');
        fill('red');
    }
    strokeWeight(2);
    let heading = dotA;
    let x = dotX*scaling*scaling_x;
    let y = dotY*scaling*scaling_y;
    line(x, y, x-40*sin(heading), y+40*cos(heading));
    //line(x-40*cos(heading+angAcc*5), y-40*sin(heading+angAcc*5), x+40*cos(heading+angAcc*5), y+40*sin(heading+angAcc*5));
    /*line(x-40*cos(angAcc*5), y-40*sin(angAcc*5), x+40*cos(angAcc*5), y+40*sin(angAcc*5));
    strokeWeight(4);
    //line(x-40*cos(heading+angAcc*5), y-40*sin(heading+angAcc*5), x-20*cos(heading+angAcc*5), y-20*sin(heading+angAcc*5));
    //line(x+20*cos(heading+angAcc*5), y+20*sin(heading+angAcc*5), x+40*cos(heading+angAcc*5), y+40*sin(heading+angAcc*5));
    line(x-40*cos(angAcc*5), y-40*sin(angAcc*5), x-20*cos(angAcc*5), y-20*sin(angAcc*5));
    line(x+20*cos(angAcc*5), y+20*sin(angAcc*5), x+40*cos(angAcc*5), y+40*sin(angAcc*5));*/
    triangle(x, y, x-10*sin(heading)+4*cos(heading), y+10*cos(heading)+4*sin(heading), x-10*sin(heading)-4*cos(heading), y+10*cos(heading)-4*sin(heading));
}
function handleMouseMove(e) {
    if(isDraw) {
      //let scaledMovement = e.movementY/4096; // 4096
      var scaledMovement;
      scaledMovement = e.movementX/20000;
      angAcc += scaledMovement;
      //let scaledMovement = (e.clientY-mouseYOffset)/4096;
      //angAcc = scaledMovement + moveNoise(currentSession);
      //console.log(angAcc);
      angAcc = fixBetween(angAcc, -maxA/5, +maxA/5);
    }
}
function handleClick() {
    startSession();
}
function moveNoise(mode) {
    // Standard Normal variate using Box-Muller transform.
    const mean = 0;
    const std = 0.5;
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    noiseM = z * std + mean;
    return noiseM*0.1;
    /*if(mode < 2)
        //return 0;
    //else 
    if(true) {
        if(frameNum %1 == 0) {
            // Standard Normal variate using Box-Muller transform.
            const mean = 0;
            const std = 0.5;
            const u = 1 - Math.random(); // Converting [0,1) to (0,1]
            const v = Math.random();
            const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
            // Transform to the desired mean and standard deviation:
            noiseM = z * std + mean;
            return noiseM*0.1;
        } else {
            return noiseM*0.1;
        }
        // Standard Normal variate using Box-Muller transform. mod1
            const mean = 0;
            const std = 0.1;
            const u = 1 - Math.random(); // Converting [0,1) to (0,1]
            const v = Math.random();
            const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
            // Transform to the desired mean and standard deviation:
            noise = z * std + mean;
            return noise;
    }
    return 0;*/
}
function avgError(arr1, arr2) {
    // mean square error
    let maxlen = min(arr1.length, arr2.length);
    if(maxlen == 0)
        return 0.0;
    let avg = 0.0;
    for(let i=0; i<maxlen; i++)
        avg += pow(arr1[i]-arr2[i], 2);
    return avg/maxlen;
}

function startGame() {
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    fullscreen(true);
    select('#instrDiv').hide();
    totalTrainBlocks = trainBlocks.length;
    var sample;
    fetch('./data.json').then((res) => {
        if (!res.ok) {throw new Error (`HTTP error! Status: ${res.status}`);}
        return res.json();
        }).then((data) => {sample=data; console.log(data)}).catch((error) => console.error("Unable to fetch data:", error));
    //const data = require('./data.json');
    //console.log(sample);
    trainBlockStart();
}
// Function that ends the game appropriately after the experiment has been completed
function endGame() {
    fullscreen(false);
    select('#container-exp').hide();
    remove();
    document.getElementById("container-exp").onmousemove = null;
    document.body.style.overflow = 'auto';
}