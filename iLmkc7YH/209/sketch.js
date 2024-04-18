let cnv;
let currentTrainBlock = 0;
let trainBlocks = [7, 7, 7, 7];
let totalTrainBlocks;
let max_amplitudes = [1/2, 1/4, 1/8, 1/16, 1/32, 1/64, 1/128];
let frequency = [0.1,0.25,0.55,0.85,1.15,1.55,2.05];
let frameNum = 0; // Number of frames in the current session
var timeout;
var dotX;
var dotY;
var dotV = [1.0, 1.0];
var dotA;
var maxX;
var width_x = 240; // 24
var scaling = 1.0; // 1.5
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
var blockErr = [];
var blockErrn_x = [];
var blockErrn = [];
var blockErrr_x = [];
var blockErrr = [];
var blockNam = [];
var h;
var maxA;
var maxPoints;
var time;
var fps;
var error;
var susE;
var goodjob;
var noiseM;
var path;
var pathWidth = 15;
var vDist;
var pIdx;
var trace;
var traceBuffer;
var traceLen = 20;
var inactivity;
var sessionsType;
var sessionTotal;
var perturbation;
var perturbDir;
var perturbCoord;
var perturbLen;
var perturbCount = 6 + 1;
var perturbDist = 80;
var nextPerturb;
var prevPath;
var prevPathAlpha;
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
    //startGame();
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    let type = blockType%4;
    if(type/2 < 1) {
        if(type == 0) {
            sessions = 2;
            sessionsType = [2, 0];
        } else if(type == 1) {
            sessions = 3;
            sessionsType = [3, 0, 1];
        }
    } else {
        if(type == 2) {
            sessions = 1;
            sessionsType = [0];
        } else {
            sessions = 2;
            sessionsType = [0, 1];
        }
    }
    offset = 0;
    currentSession = 0;
    sessionInfo(0, 0);
}
function sessionNext() {
    document.exitPointerLock();
    currentSession += 1;
    sessionTotal += 1;
    //blockNam.push((currentSession<3?"Test":"Train")+(currentTrainBlock*3+currentSession));
    if(currentSession<2) {
        //offset = 1-offset;
        sessionInfo(0, 1-offset);
    }
    else if(currentSession == 2) {
        //offset = blockType%2;
        sessionInfo(1, blockType%2);
    }
    else
        sessionInfo(2, offset);
}
function startSession(type) {
    dotX = 0;
    dotY = 0;
    dotA = 0;
    angAcc = 0;
    dotU =0;
    //width_x = 240;
    maxX = width_x*0.625; //15
    isDraw = true;
    select('#container-exp').show()
    document.getElementById("container-exp").onmousemove = handleMouseMove;
    document.getElementById("container-exp").requestPointerLock();
    dis = []; 
    ang = [];
    act = [];
    vDist = [];
    maxPoints = 0;
    if(type == 0)
        maxPoints = 2000; //2000
    else if(type == 1)
        maxPoints = 10000; //10000
    if(type == 1 || blockType < 4) {
        lines = sinuousCurve(maxPoints);
        perturbation = -1;
        perturbDir = null;
        perturbCoord = null;
        perturbLen = null;
    } else {
        lines = straightLine(maxPoints);
        perturbation = Math.floor(maxPoints/perturbCount)+1;
        perturbDir = shuffle([-1, -1, 0, 0, 1, 1]);
        perturbCoord = [];
        perturbLen = [];
        for(let i=1; i<perturbCount; i++) {
            perturbLen.push((perturbation-perturbDist) * (Math.random()/2+0.5) + perturbDist);
            //perturbLen.push(perturbation/2);
            perturbCoord.push(perturbation*i + 1);
        }
    }
    /*else {
        lines = straightLine(maxPoints);
        perturbation = Math.floor(maxPoints/perturbCount)+1;
        perturbDir = [];
        perturbCoord = [];
        for(let i=1; i<perturbCount; i++) {
            perturbDir.push((Math.floor(Math.random()*3) - 1) * perturbDist);
            perturbCoord.push(perturbation*i + 1);
        }
    }*/
    clear();
    timeout = maxPoints+60;
    frameNum = 0;
    error = 0.0;
    susE = 0;
    goodjob = 0;
    noiseM = 0.0;
    pIdx = [0, 0];
    trace = [];
    traceBuffer = null;
    inactivity = 0;
    nextPerturb = 0;
    prevPath = [];
    prevPathAlpha = 0;
    loop();
}
function sessionInfo(type, nextOffset) {
    noLoop();
    clear();
    isdraw = false;
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    let plot = select('#plot');
    var mse;
    htmlDiv.show();
    if(currentSession > 0) {
        mse = error/dis.length;
        blockErr.push(mse);
        let isTrain = sessionsType[currentSession-1]%4 > 1;
        blockNam.push((isTrain?"Train":"Test")+sessionTotal);
        if(offset == 0) {
            blockErrn.push(mse);
            blockErrn_x.push((isTrain?"Train":"Test")+sessionTotal);
        } else {
            blockErrr.push(mse);
            blockErrr_x.push((isTrain?"Train":"Test")+sessionTotal);
        }
        // Define Data
        const idx = Array.from(Array(maxPoints).keys());
        let data = [
            {x: blockNam, y: blockErr, type: 'scatter', mode: 'lines', line: {color: 'green', width: 3}, name: 'Error'},
            {x: blockErrn_x, y: blockErrn, type: 'scatter', mode: 'markers', marker: {color: 'blue', size: 10}, name: 'Normal'},
            {x: blockErrr_x, y: blockErrr, type: 'scatter', mode: 'markers', marker: {color: 'red', size: 10}, name: 'Reverse'},
            //{x: Array.from(Array(act.length).keys()), y: act, xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {color: 'black', width: 3}, name: 'Actions'},
            {x: idx, y: lines, xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {color: 'black', width: 3}, name: 'Path'},
            {x: vDist, y: dis, xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {color: 'blue', width: 3}, name: 'You'},
        ];
        // layout
        var layout = {
            title: 'Average Mean Square Error and Trajectory',
            yaxis: {rangemode: "tozero"},
            grid: {rows: 1, columns: 2, pattern: 'independent'},
        };
        // Display using Plotly
        plot.show();
        Plotly.newPlot("plot", data, layout, {responsive: true});
    } else {
        mse = -1.0;
        plot.hide();
    }
    mse = mse.toFixed(3);
    select('#container-exp').hide()
    document.getElementById("container-exp").onmousemove = null;
    let button = document.getElementById("startBt");
    //offset = nextOffset;
    offset = sessionsType[currentSession]%2;
    testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
    /*if(type == 0) {
        if(currentSession == 0)
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>The next session is a ${textDesc[offset]}.<br>Click the Continue button to proceed.`);
        else
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Mean Square Error: ${mse}<br>The next session is a ${textDesc[offset]}.<br>Click the Continue button to proceed.`);
        button.onclick = ()=>{select('#endDiv').hide();startSession(testTrain);};*/
    if(currentSession == 0) {
        instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>The next session is a ${textDesc[sessionsType[currentSession]%4]}.<br>Click the Continue button to proceed.`);
        button.onclick = ()=>{select('#endDiv').hide();startSession(testTrain);};
    } else if(currentSession < sessions) {
        instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Mean Square Error: ${mse}<br>The next session is a ${textDesc[sessionsType[currentSession]%4]}.<br>Click the Continue button to proceed.`);
        button.onclick = ()=>{select('#endDiv').hide();startSession(testTrain);};
    } else { 
        if(currentTrainBlock+1 < totalTrainBlocks){
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Mean Square Error: ${mse}<br>Click the Continue button to proceed to next training block.`);
            button.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else{
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Mean Square Error: ${mse}<br>Click the Continue button to proceed.`);
            button.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; endGame();};//select('#endDiv').hide();
        }
    }
}
function draw() {
    if(isDraw) {
        clear();
        background('white');
        if(-dotY > maxPoints) {
            sessionNext();
            return;
        }
        if(inactivity > 180) {
            pause();
        }
        if(offset == 0)
            //dotU = fixBetween(angAcc, -maxA, +maxA);
            dotU = angAcc; //fixBetween(angAcc, -maxA, +maxA);
        else
            //dotU = fixBetween(-angAcc, -maxA, +maxA);
            dotU = -angAcc; //fixBetween(-angAcc, -maxA, +maxA);
        dotA = dotA + dotU + moveNoise(blockType); //fixBetween(dotA + dotU + moveNoise(blockType), -maxA, +maxA);
        if(dotA < -maxA) {
            dotA = -maxA;
            //angAcc = 0.0;
        } else if(dotA > maxA) {
            dotA = maxA;
            //angAcc = 0.0;
        }
        dotX = fixBetween(dotX + dotV[0]*sin(dotA), -maxX, maxX);
        if(perturbation>0 && nextPerturb<perturbCount && -dotY>perturbCoord[nextPerturb]) {
            console.log(perturbDir[nextPerturb]+" "+dotY);
            if(perturbDir[nextPerturb] != 0) {
                y = perturbCoord[nextPerturb];
                prevPath = [];
                for(let i=0; i<perturbLen[nextPerturb]-perturbDist; i++) { // for(let i=0; i<perturbation/2; i++) {
                    prevPath.push({x: lines[y], y: y})
                    lines[y] += perturbDir[nextPerturb] * perturbDist;
                    y++;
                }
                for(let i=0; i<perturbDist; i++) { // new
                    prevPath.push({x: lines[y], y: y})
                    lines[y] += perturbDir[nextPerturb] * (perturbDist-i);
                    y++;
                }
                prevPathAlpha = 124;
            }
            nextPerturb++;
        }
        dotY -= dotV[1]*cos(dotA);
        translate(windowWidth/2, windowHeight*2/3 - dotY*scaling*scaling_y);
        drawFadingCurve(prevPath, prevPathAlpha);
        drawCurve(lines, int(-(dotY+windowHeight/2/scaling/scaling_y)), int(-(dotY-windowHeight/scaling/scaling_y)));
        heading = dotA;
        var pathError = 0;
        if(-dotY <= maxPoints) {
            dis.push(dotX);
            vDist.push(-dotY);
            ang.push(dotA);
            act.push(angAcc);
            frameNum++;
            pathError = distToPath();
            if(pathError > pathWidth)
                inactivity++;
        }
        if(frameNum%5 == 0) {
            if(-dotY <= maxPoints) {
                if(traceBuffer != null)
                    trace.push(traceBuffer);
                if(trace.length > traceLen)
                    trace.shift();
                traceBuffer = {x: dotX, y: dotY};
            } else
                trace.shift();
        }
        drawBike();
        drawTrace();
        error += pathError;
        //drawAngSpeedBar(0, dotY*scaling*scaling_y+windowHeight*1/6);
        //drawErrorPanel(windowWidth/2-h-60, dotY*scaling*scaling_y-windowHeight*2/3+60);
    }
}
function fixBetween(x, minimum, maximum) {
    if(x < minimum)
        return minimum;
    else if(x > maximum)
        return maximum;
    return x;
}
function dist2(v, w) { return (v.x - w.x)**2 + (v.y - w.y)**2 } // squared distance from point to point
function distToSegmentSquared(p, v, w) { // squared distance from point to line segment
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}
//function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
function distToPath() { // squared distance to path, approximate
    var minDist = 4 * maxX*maxX;
    let startFix = int(-dotY - pathWidth*100);
    if(startFix < 0)
        startFix = 0;
    let endFix = int(-dotY + pathWidth*100);
    if(endFix > lines.length)
        endFix = lines.length;
    for(let i = startFix+1; i<endFix; i++) {
        let dist = distToSegmentSquared({x: dotX, y: -dotY}, {x: lines[i-1], y: (i-1)}, {x: lines[i], y:i});
        if(dist < minDist)
            minDist = dist;
    }
    return minDist;
}
function sinuousCurve(len) {
    var points = [];
    let straightLen = 60;
    //path = [];
    //let lPath = [];
    //let rPath = [];
    let start = 0;
    for(let i=0; i<straightLen; i++)
        points.push(0.0);
    for(let i=straightLen*2; i<len; i++) {
        var X = 0;
        var X2 = 0;
        for(let j=0; j<max_amplitudes.length; j++) {
            X += width_x/2*max_amplitudes[j]*sin(2*PI*start*frequency[j]);
            X2 += 2*PI*frequency[j]*0.01*width_x/2*max_amplitudes[j]*cos(2*PI*start*frequency[j]);
        }
        points.push(X);
        //let n = sqrt(X2**2 + 1); // normalizing constant
        //lPath.push({x: -1*pathWidth/n + X, y: X2*pathWidth/n + i});
        //rPath.push({x: 1*pathWidth/n + X, y: -X2*pathWidth/n + i});
        start += 0.01; // 0.02
    }
    for(let i=0; i<straightLen; i++)
        points.push(X);
    //path.push(lPath);
    //path.push(rPath);
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
    let startFix = start;
    if(startFix < 0)
        startFix = 0;
    let endFix = end;
    if(endFix > coords.length)
        endFix = coords.length;
    stroke('black');
    strokeWeight(6);
    for(let i = startFix+1; i<endFix; i++) {
        line(coords[i-1]*scaling*scaling_x, -(i-1)*scaling*scaling_y, coords[i]*scaling*scaling_x, -i*scaling*scaling_y);
    }
    /*stroke('lightgrey');
    strokeWeight(4);
    for(let i = startFix+1; i<endFix; i++) {
        for(let j of path) {
            line(j[i-1].x*scaling*scaling_x, -j[i-1].y*scaling*scaling_y, j[i].x*scaling*scaling_x, -j[i].y*scaling*scaling_y);
        }
    }*/
}
function drawFadingCurve(coords, alpha) {
    if(alpha > 0) {
        noFill();
        var baseColor = color('orange');
        baseColor.setAlpha(alpha);
        stroke(baseColor);
        strokeWeight(5);
        //console.log(alpha);
        line(coords[0].x*scaling*scaling_x-50, -coords[0].y*scaling*scaling_y-80, coords[0].x*scaling*scaling_x+50, -coords[0].y*scaling*scaling_y-20);
        line(coords[0].x*scaling*scaling_x+50, -coords[0].y*scaling*scaling_y-80, coords[0].x*scaling*scaling_x-50, -coords[0].y*scaling*scaling_y-20);
        for(let i = 1; i<coords.length; i++) {
            //if(coords[i].y > -dotY && coords[i-1].y < -dotY)
            line(coords[i-1].x*scaling*scaling_x, -coords[i-1].y*scaling*scaling_y, coords[i].x*scaling*scaling_x, -coords[i].y*scaling*scaling_y);
        }
        prevPathAlpha -= 2;
    }
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
    text("FPS: " + fps, x-h*3/4, y-h/4);
    //if(frameNum < maxPoints) {
    if(-dotY <= maxPoints) {
        //let curE = pow(dotX - lines[frameNum], 2);
        let curE = distToPath();
        //error += curE;
        if(curE < pathWidth**2) { // curE < avgE*0.8
            fill('green');
            susE += 1;
        }
        else if(curE > pathWidth**2) { // curE > avgE*1.2
            fill('red');
            susE -= 1;
        }
        susE = fixBetween(susE, 0, 120);
        text("Error: " + curE.toFixed(2), x-h*3/4, y+h/4)
        if(goodjob > 0) {
            text("Error: " + curE.toFixed(2), dotX*scaling*scaling_x + 60, dotY*scaling*scaling_y);
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
            }
        }
    }
    let avgE = error/frameNum;
    fill('black');
    text("Avg Error: " + avgE.toFixed(2), x-h*3/4, y);
}
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}
/*function shuffleList(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}*/
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
    //line(x, y, x-40*sin(heading), y+40*cos(heading));
    //triangle(x, y, x-10*sin(heading)+4*cos(heading), y+10*cos(heading)+4*sin(heading), x-10*sin(heading)-4*cos(heading), y+10*cos(heading)-4*sin(heading));
    let A = dotU*20;
    let d = dotU*80*40/PI;
    triangle(x+10*sin(heading+A), y-10*cos(heading+A), x+4*cos(heading+A), y+4*sin(heading+A), x-4*cos(heading+A), y-4*sin(heading+A));
    noFill();
    curve(x+d*cos(heading),y+d*sin(heading), x, y, x-30*sin(heading), y+30*cos(heading), x-30*sin(heading)+d*cos(heading), y+30*cos(heading)+d*sin(heading));
}
function drawTrace() {
    var baseColor;
    if(offset == 0)
        baseColor = color('blue');
    else
        baseColor = color('red');
    var transparency = 0;
    var increment = 255/traceLen;
    for(let i in trace) {
        baseColor.setAlpha(transparency);
        stroke(baseColor);
        fill(baseColor);
        ellipse(trace[i].x*scaling*scaling_x, trace[i].y*scaling*scaling_y, 2, 2);
        transparency += increment;
    }
}
function pause() {
    document.exitPointerLock();
    noLoop();
    clear();
    isdraw = false;
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    select('#container-exp').hide()
    document.getElementById("container-exp").onmousemove = null;
    let button = document.getElementById("startBt");
    instr.html(`<br><br>Are you still there?<br><br>The experiment has been paused because we cannot detect any cursor activity for a few seconds.<br>Click the Continue button when you are ready to resume.`);
    button.onclick = ()=>{select('#endDiv').hide();resume();};
}
function resume() {
    isDraw = true;
    inactivity = 0;
    select('#container-exp').show()
    document.getElementById("container-exp").onmousemove = handleMouseMove;
    document.getElementById("container-exp").requestPointerLock();
    clear();
    loop();
}
function handleMouseMove(e) {
    if(isDraw) {
        var scaledMovement;
        inactivity = 0;
        scaledMovement = e.movementX/5000;
        angAcc += scaledMovement;
        angAcc = fixBetween(angAcc, -maxA/20, +maxA/20);
    }
}
function handleClick() {
    startSession();
}
function moveNoise(mode) {
    return 0;
    const mean = 0;
    const std = 0.05;
    return randomGaussian(mean, std);
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
    h = min(windowHeight*1/6, 100);
    scaling_x = windowWidth/300;
    scaling_y = scaling_x;
    select('#instrDiv').hide();
    totalTrainBlocks = trainBlocks.length;
    sessionTotal = 0;
    trainBlockStart();
}
// Function that ends the game appropriately after the experiment has been completed
function endGame() {
    select('#container-exp').hide();
    remove();
    document.getElementById("container-exp").onmousemove = null;
    document.body.style.overflow = 'auto';
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    h = min(windowHeight*1/6, 100);
    scaling_x = windowWidth/300;
    scaling_y = scaling_x;
}