let cnv;
let currentTrainBlock = 0;
let trainBlocks = [6, 4, 4, 4, 4, -1, 7, 5, 5, 5, 5];
let totalTrainBlocks;
let max_amplitudes = [[1/2,-1/4,-1/8,1/32,1/16,-1/128,-1/64,1/128],[1/5,-1/10,-1/20,1/80,1/40]];
let frequency = [[0.05,0.1,0.25,0.55,0.85,1.15,1.55,2.05],[0.2,0.4,1.0,1.4,2.2]];
let frameNum = 0; // Number of frames in the current session
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
var nse;
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
var path = null;
var pathWidth = 15;
var vDist;
var pIdx;
var trace;
var traceBuffer;
var traceLen = 10;
var inactivity;
var sessionsType;
var sessionTotal;
var perturbation;
var perturbDir;
var perturbCoord;
var perturbLen = 40;
var perturbCount = 6 + 1;
var perturbDist = 80;
var nextPerturb;
var perturbing;
var straightLen = 60;
var blanknum;
var blank;
var pOffsets;
var highscore;
var timer;
var timerCount;
var textDesc = [
    "short straight line testing session of normal control with perturbation",
    "short straight line testing session of reverse control with perturbation",
    "straight line training session of normal control with perturbation",
    "straight line training session of reverse control with perturbation",
    "combined testing session of normal control",
    "combined testing session of reverse control",
    "training session for practising normal control",
    "training session for practising reverse control"
]
function setup() {
    isDraw = false;
    //select('#endDiv').hide();
    //select('#instrDiv').hide();
    //startGame();
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    if(blockType<0) {
        startBreak(-blockType);
        return;
    }
    let type = blockType%4;
    if(type < 2) {
        if(type == 0) {
            sessionsType = [6, 4];
        } else if(type == 1) {
            sessionsType = [7, 4, 5];
        }
    } else {
        if(type == 2) {
            sessionsType = [4];
        } else {
            sessionsType = [4, 5];
        }
    }
    sessions = sessionsType.length;
    offset = 0;
    currentSession = 0;
    sessionInfo(0, 0);
}
function sessionNext() {
    document.exitPointerLock();
    currentSession += 1;
    sessionTotal += 1;
    if(currentSession<2)
        sessionInfo(0, 1-offset);
    else if(currentSession == 2)
        sessionInfo(1, blockType%2);
    else
        sessionInfo(2, offset);
}
function startSession(type) {
    dotY = 0;
    dotA = 0;
    angAcc = 0;
    dotU =0;
    maxX = width_x*0.625; //15
    isDraw = true;
    select('#container-exp').show()
    document.getElementById("container-exp").onmousemove = handleMouseMove;
    document.getElementById("container-exp").requestPointerLock();
    dis = []; 
    ang = [];
    act = [];
    vDist = [];
    nse = [];
    maxPoints = 0;
    if(type == 0) {
        maxPoints = 500; //2000
        blanknum = 0;
        if(trainBlocks[currentTrainBlock]%4<2)
            blank = shuffle([1/30,1/15,0.1,2/15,0.2,4/15,0.4,8/15,11/15,1.0]);
        else
            blank = reverse([1/30,1/15,0.1,2/15,0.2,4/15,0.4,8/15,11/15,1.0]);
    }
    else if(type == 1) {
        maxPoints = 2000; //10000
        blanknum = 0;
        blank = [1.0];
    }
    if(sessionsType[currentSession]>3) {
        lines = sinuousCurve(maxPoints, type!=0);
        perturbation = -1;
        perturbDir = null;
        perturbCoord = null;
    } else {
        lines = straightLine(maxPoints);
        perturbation = Math.floor(maxPoints/perturbCount)+1;
        perturbDir = shuffle([-1, -1, 0, 0, 1, 1]);
        perturbCoord = [];
        perturbing = 0;
        for(let i=1; i<perturbCount; i++)
            perturbCoord.push(perturbation*i + 1);
    }
    clear();
    dotX = lines[0];
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
        // Record data
        let blockData = {
            xh: lines,
            x: dis,
            y: vDist,
            a: ang,
            u: act,
            n: nse,
            per: perturbDir,
            num: sessionTotal,
            type: sessionsType[currentSession-1],
            hori: blank,
            offs: pOffsets
        }
        //recordTrialSession(trialcollection, blockData);
        console.log(blockData)
        if(isTrain) {
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
            plot.html("");
            Plotly.newPlot("plot", data, layout, {responsive: true});
        } else {
            let msg;
            if(highscore<0) {
                highscore = mse;
                msg = "<br><br>Best performance error:"+highscore;
            } 
            else if(mse<highscore) {
                highscore = mse;
                msg = `<br><br>Congratulations! Your score improved better! Keep it up!<br><br>Best performance error: ${highscore}`;
            } else {
                msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance error: ${highscore}`;
            }
            plot.show();
            plot.html(msg);
        }
    } else {
        mse = -1.0;
        plot.hide();
    }
    mse = mse.toFixed(3);
    select('#container-exp').hide()
    document.getElementById("container-exp").onmousemove = null;
    let button = document.getElementById("startBt");
    offset = sessionsType[currentSession]%2;
    testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
    if(currentSession == 0) {
        instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>The next session is a ${textDesc[sessionsType[currentSession]]}.<br>Click the Continue button to proceed.`);
        button.onclick = ()=>{plot.hide();select('#endDiv').hide();startSession(testTrain);};
    } else if(currentSession < sessions) {
        instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Mean Square Error: ${mse}<br>The next session is a ${textDesc[sessionsType[currentSession]]}.<br>Click the Continue button to proceed.`);
        button.onclick = ()=>{plot.hide();select('#endDiv').hide();startSession(testTrain);};
    } else { 
        if(currentTrainBlock+1 < totalTrainBlocks){
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Mean Square Error: ${mse}<br>Click the Continue button to proceed to next training block.`);
            button.onclick = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else{
            instr.html(`<br><br>Session ${currentSession}/${sessions} of Block ${currentTrainBlock+1}/${totalTrainBlocks} completed.<br>Mean Square Error: ${mse}<br>Click the Continue button to proceed.`);
            button.onclick = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; endGame();};//select('#endDiv').hide();
        }
    }
}
function draw() {
    if(isDraw) {
        clear();
        background('white');
        if(-dotY > maxPoints+straightLen) {
            if(blanknum < blank.length-1) {
                blanknum++;
                //dotY = 0.0
                maxPoints += 500+straightLen;
                dotX = lines[-dotY];
                dotA = 0.0;
                angAcc = 0.0;
            } else {
                sessionNext();
                return;
            }
        }
        if(inactivity > 180) {
            pause();
        }
        if(offset == 0)
            dotU = angAcc;
        else
            dotU = -angAcc;
        var noise = moveNoise(sessionsType[currentSession]);
        dotA = dotA + dotU + noise;
        if(dotA < -maxA) {
            dotA = -maxA;
        } else if(dotA > maxA) {
            dotA = maxA;
        }
        dotX = fixBetween(dotX + dotV[0]*sin(dotA), -maxX, maxX);
        if(perturbation>0) {
            if(perturbing > 0) {
                dotX += perturbDist/perturbLen*perturbDir[nextPerturb];
                perturbing--;
                if(perturbing == 0)
                    nextPerturb++;
            } else {
                if(nextPerturb<perturbCount && -dotY>perturbCoord[nextPerturb]) {
                    if(perturbDir[nextPerturb] != 0)
                        perturbing = perturbLen;
                    else
                        nextPerturb++;
                }
            }
        }
        
        dotY -= dotV[1];
        translate(windowWidth/2, windowHeight*2/3 - dotY*scaling*scaling_y);
        //drawCurve(lines, int(-(dotY+windowHeight/2/scaling/scaling_y)), int(-(dotY-windowHeight/scaling/scaling_y)));
        stroke('black');
        strokeWeight(4);
        noFill();
        rect(-maxX*scaling*scaling_x, -(maxX-dotY)*scaling*scaling_y, maxX*scaling*scaling_x*2, maxX*scaling*scaling_y*1.5);
        //drawCurve(lines, int(-(dotY+windowHeight/3/scaling/scaling_y)), int(-(dotY-windowHeight*2/3/scaling/scaling_y*1.0)));
        if(blank.length>1) {
            let high = int(maxX*blank[blanknum]-dotY);
            let low = int(-dotY-maxX/2*blank[blanknum]);
            let plen = 500+straightLen;
            drawCurve(lines, max(low,blanknum*plen), min(high,blanknum*plen+plen), blank[blanknum]<0.9);
        } else
            drawCurve(lines, int(-dotY-maxX/2*blank[blanknum]), int(maxX*blank[blanknum]-dotY), blank[blanknum]<0.9);
        heading = dotA;
        var pathError = 0;
        if(-dotY <= maxPoints+straightLen) {
            dis.push(dotX);
            vDist.push(-dotY);
            ang.push(dotA);
            act.push(angAcc);
            nse.push(noise);
            frameNum++;
            //pathError = distToPath();
            pathError = linearError();
            //if(perturbation < 0)
                //pathError = collision();
            if(pathError > pathWidth)
                inactivity++;
            if(frameNum%5 == 0) {
                if(traceBuffer != null)
                    trace.push(traceBuffer);
                if(trace.length > traceLen)
                    trace.shift();
                traceBuffer = {x: dotX, y: dotY};
            }
        }
        /*if(frameNum%5 == 0) {
            if(-dotY <= maxPoints) {
                if(traceBuffer != null)
                    trace.push(traceBuffer);
                if(trace.length > traceLen)
                    trace.shift();
                traceBuffer = {x: dotX, y: dotY};
            } else
                trace.shift();
        }*/
        drawBike();
        drawTrace();
        error += pathError;
        strokeWeight(1);
        textAlign(CENTER);
        textSize(16);
        let msg = sessionsType[currentSession]%4>1?"Train: time to learn how to do the task!":"Test; now it is time to see if you have improved!"
        text(msg, 0, (dotY-maxX)*scaling*scaling_y+20);
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
function linearError() {
    if(dotY>0 || -dotY>=lines.length)
        return 0;
    return (dotX-lines[-dotY])**2;
}
function projToSegmentSquared(p, v, w) { // squared distance from point to line segment
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
}
function sinuousCurve(len, random) {
    var points = [];
    let start = 0;
    var offset;
    var ampl;
    var freq;
    var repeat;
    if(sessionsType[currentSession]%4 > 1) { //is train
        ampl = max_amplitudes[0];
        freq = frequency[0];
        repeat = 0;
    } else {
        ampl = max_amplitudes[1];
        freq = frequency[1];
        repeat = 10;
    }
    if(random)
        offset = Array(ampl.length).fill().map(() => Math.random()*2*PI)
    else
        offset = Array(ampl.length).fill(0.0);
    
    let X = 0;
    /*for(let j=0; j<ampl.length; j++) {
        X += width_x/2*ampl[j]*sin(offset[j]);
    }
    for(let i=0; i<straightLen; i++) {
        points.push(X);
    }*/
    for(let i=0; i<len; i++) {
        X = 0;
        for(let j=0; j<ampl.length; j++) {
            X += width_x/2*ampl[j]*sin(2*PI*start*freq[j]+offset[j]);
        }
        points.push(X);
        start += 0.01; // 0.02
    }
    /*for(let i=0; i<straightLen; i++) {
        points.push(X);
    }*/
    if(repeat > 0) {
        var paths = [];
        pOffsets = [];
        for(let i=0; i<repeat; i++) {
            let offset = int(Math.random()*points.length);
            pOffsets.push(offset);
            var path = arrayRotate(points.slice(0), offset);
            //path.unshift(Array(straightLen).fill(path[0]));
            //path.push(Array(straightLen).fill(path[path.length-1]));
            paths = paths.concat(Array(straightLen).fill(path[0]).concat(path));
        }
        return paths;
    } else {
        //points.unshift(Array(straightLen).fill(points[0]));
        //points.push(Array(straightLen).fill(X));
        pOffsets = [0];
        return Array(straightLen).fill(points[0]).concat(points);
    }
}
function arrayRotate(arr, count) {
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
function straightLine(len) {
    var points = [];
    path = null;
    let start = 0;
    for(let i=0; i<len; i++) {
        points.push(0.0);
    }
    return points;
}
function drawCurve(coords, start, end, cover=false) {
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
    if(cover) {
        fill('grey');
        strokeWeight(2);
        rect(-maxX*scaling*scaling_x, -(maxX-dotY)*scaling*scaling_y, 2*maxX*scaling*scaling_x, maxX*(1-blank[blanknum])*scaling*scaling_y);
        if(blank[blanknum]<0.8) {
            rect(-maxX*scaling*scaling_x, (maxX/2+dotY)*scaling*scaling_y, 2*maxX*scaling*scaling_x, maxX*(blank[blanknum]-1)/2*scaling*scaling_y);
        }
    }
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
    if(-dotY <= maxPoints) {
        let curE = distToPath();
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
function startBreak(len) {
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    //let btn = select('#startBt');
    htmlDiv.show();
    timerCount = 60;
    instr.html(`<br><br>Let's take a ${len} minute break.<br><br>${timerCount}`);
    //document.getElementById("startBt").setAttribute("disabled", true);
    select('#startBt').hide();
    timer = setInterval(countDown, 100);
    
}
function countDown() {
    if(--timerCount>0) {
        select('#endInstr').html(`<br><br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br><br>${timerCount}`);
    } else {
        let btn = document.getElementById("startBt");
        clearInterval(timer);
        select('#endInstr').html(`<br><br>Now we will play a reversed version of the game!<br><br>at each test, you will be tested on both normal and reversed`);
        btn.style.display = 'block';
        //btn.removeAttribute("disabled");
        btn.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
    }
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
    if(true)
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
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x/0.75*0.8;
    scaling_x = sx < sy? sx:sy;
    scaling_y = scaling_x;
    select('#instrDiv').hide();
    totalTrainBlocks = trainBlocks.length;
    sessionTotal = 0;
    maxA = PI/2;
    highscore = -1;
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
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x/0.75*0.8;
    scaling_x = sx < sy? sx:sy;
    scaling_y = scaling_x;
}