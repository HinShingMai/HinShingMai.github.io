let cnv;
let dpi;
let currentTrainBlock = 0;
let trainBlocks = [4, 4];
/*
-n: n-minutes break
4: normal training block
5: reverse training block
6: normal testing block
7: reverse testing block
*/
let totalTrainBlocks;
var amplitudes_low = [[1/7,1/9,1/11,0,0,0,0],[1/12,1/18,1/22,0,0,0,0]];
var amplitudes_hi = [[0,1/5,0,0,-1/23,1/31,-1/41],[0,1/9,0,0,-1/33,-1/39,1/51]];
var amplitudes;
let frequency = [[2/20,5/20,11/20,17/20,23/20,31/20,41/20],[2/6,3/6,5/6,7/6,11/6,13/6,17/6]];
let frameNum = 0; // Number of frames in the current session
var dotX;
var dotY;
//var dotV = [1.0, 1.0];
var dotA;
var maxX;
var width_x = 240;
var scaling;
var angAcc;
var lines;
var currentSession;
var sessions;
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
var sessionComplete;
var sessionTotal;
var perturbation;
var perturbDir;
var perturbCoord;
var perturbLen = 40;
var perturbCount = 6 + 1;
var perturbDist = 80;
var nextPerturb;
var perturbing;
var straightLen = 40;
var blanknum;
var blank;
var pOffsets;
var highscore;
var timer;
var timerCount;
var movin;
var frBuffer;
var plen;
function setup() {
    isDraw = false;
    frameRate(60);
    randomSeed(1024);
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    if(currentTrainBlock < 1)
        amplitudes = amplitudes_low;
    else
        amplitudes = amplitudes_hi;
    if(blockType<0) {
        startBreak(-blockType);
        return;
    }
    let type = blockType%4;
    // arrange sessions in a block
    /*
        4: normal testing session
        5: reverse testing session
        6: normal training session
        7: reverse training session
    */
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
            sessionsType = [5];
        }
    }
    sessions = sessionsType.length;
    currentSession = 0;
    sessionInfo(0, 0);
}
function sessionNext() {
    document.getElementById("container-exp").onmousemove = null;
    document.exitPointerLock();
    noLoop();
    clear();
    isdraw = false;
    currentSession++;
    sessionComplete++;
    if(currentSession<2)
        sessionInfo(0);
    else if(currentSession == 2)
        sessionInfo(1);
    else
        sessionInfo(2);
}
function startSession(type) { // type: 0=test, 1=train
    dotY = 0;
    dotA = 0;
    angAcc = 0;
    dotU =0;
    maxX = width_x*0.625; //150
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
        maxPoints = 600; //2000
        blanknum = 0;
        if(highscore[offset]<0) // don't shuffle for the first test
            blank = [1/30,1/15,0.1,2/15,0.2,1/3,0.5,112/150,1];
        else
            blank = shuffle([1/30,1/15,0.1,2/15,0.2,1/3,0.5,112/150,1]);
    }
    else if(type == 1) {
        maxPoints = 2000; //10000
        blanknum = 0;
        blank = [1,1,1,1,1];
    }
    if(sessionsType[currentSession]>3) {
        lines = sinuousCurve(maxPoints, type);
        perturbation = -1;
        perturbDir = null;
        perturbCoord = null;
    } else { // perturbation session
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
    movin=false;
    fps = 0.0;
    frBuffer = 60.0;
    plen = maxPoints+straightLen;
    loop();
}
function sessionInfo(type) {
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    let plot = select('#plot');
    var mse;
    htmlDiv.show();
    if(currentSession > 0) {
        mse = error/dis.length;
        blockErr.push(mse);
        let isTrain = sessionsType[currentSession-1]%4 > 1;
        blockNam.push((isTrain?"Train":"Test")+sessionComplete);
        if(offset == 0) {
            blockErrn.push(mse);
            blockErrn_x.push((isTrain?"Train":"Test")+sessionComplete);
        } else {
            blockErrr.push(mse);
            blockErrr_x.push((isTrain?"Train":"Test")+sessionComplete);
        }
        // Record data
        let avgfps = fps/dis.length;
        let blockData = {
            xh: lines,
            x: dis,
            y: vDist,
            a: ang,
            u: act,
            n: nse,
            per: perturbDir,
            num: sessionComplete,
            type: sessionsType[currentSession-1],
            hori: blank,
            offs: pOffsets,
            //id: subject.id,
            fps: fps/dis.length
        }
        console.log(blockData)
        //recordTrialSession(trialcollection, blockData);
        if(sessionComplete<2&&avgfps<50) {
            forceQuit();
        }
        if(isTrain) {
            // Define Data for plotting
            const idx = Array.from(Array((maxPoints+straightLen)*(blank.length)).keys());
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
                title: 'Average Error and Trajectory',
                yaxis: {rangemode: "tozero"},
                grid: {rows: 1, columns: 2, pattern: 'independent'},
            };
            // Display using Plotly
            plot.show();
            plot.html("");
            Plotly.newPlot("plot", data, layout, {responsive: true});
        } else {
            let msg;
            if(highscore[offset]<0) {
                highscore[offset] = mse;
                msg = `<br><br>Best performance error: ${highscore[offset].toFixed()}`;
            } 
            else if(mse<highscore[offset]) {
                highscore[offset] = mse;
                msg = `<br><br>Congratulations! Your score improved better! Keep it up!<br><br>Best performance error: ${highscore[offset].toFixed()}`;
            } else {
                msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance error: ${highscore[offset].toFixed()}`;
            }
            plot.show();
            plot.html(msg);
        }
    } else {
        mse = -1.0;
        plot.hide();
    }
    mse = mse.toFixed();
    select('#container-exp').hide()
    let button = document.getElementById("startBt");
    if(currentSession < sessions) { // continue to proceed to next session
        offset = sessionsType[currentSession]%2;
        testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
        let color = offset==0? "blue":"red";
        let desc;
        if(testTrain==0)
            desc = highscore[offset]<0? "Test: try to follow the black path as closely as posible":"Test: now it is time to see if you have improved!";
        else
            desc = "Train: time to learn how to do the task!";
        if(currentSession == 0)
            instr.html(`<br><span style="color:${color};">${desc}</span><br><br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br><br>Click the Continue button to proceed.`);
        else
            instr.html(`<br><span style="color:${color};">${desc}</span><br><br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br>Average Error: ${mse}<br>Click the Continue button to proceed.`);
        button.onclick = ()=>{plot.hide();select('#endDiv').hide();startSession(testTrain);};
    } else { // end of a block, continue to start of next block
        if(currentTrainBlock+1 < totalTrainBlocks){
            instr.html(`<br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br>Average Error: ${mse}<br><br>Click the Continue button to proceed to next training block.`);
            button.onclick = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else{
            instr.html(`<br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br>Average Error: ${mse}<br><br>Click the Continue button to proceed.`);
            button.onclick = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; endGame();};//select('#endDiv').hide();
        }
    }
}
function draw() {
    if(isDraw) {
        if(-dotY >= plen*(blanknum+1)) {
            if(blanknum < blank.length-1) { // next sub-session
                blanknum++;
                dotX = lines[-dotY];
                dotA = 0.0;
                angAcc = 0.0;
                movin=false;
            } else {
                sessionNext();
                return;
            }
        } else if(!movin && -dotY>=plen*blanknum+straightLen*0.75) // enable controls after a short freeze at the beginning
            movin=true;
        //var noise = moveNoise(sessionsType[currentSession]);
        var noise = 0;
        
        // record trajectory
        dis.push(dotX);
        vDist.push(-dotY);
        ang.push(dotA);
        act.push(angAcc);
        nse.push(noise);
        var pathError = linearError();
        if(pathError > pathWidth)
            inactivity++;
        if(frameNum%5 == 0) {
            if(traceBuffer != null)
                trace.push(traceBuffer);
            if(trace.length > traceLen)
                trace.shift();
            traceBuffer = {x: dotX, y: dotY};
        }
            
        if(inactivity > 100) {
            //pause();
        }
        // motion model
        if(offset == 0)
            dotU = angAcc;
        else
            dotU = -angAcc;
        
        dotA = dotA + dotU;
        if(dotA < -maxA) {
            dotA = -maxA;
        } else if(dotA > maxA) {
            dotA = maxA;
        }
        dotX  = dotX + dotA;
        if(dotX < -maxX) { // mirrors motion when hitting edge
            dotX = -maxX;
            //angAcc = offset == 0?abs(angAcc):-abs(angAcc);
            //dotA = abs(dotA);
        } else if(dotX > maxX) {
            dotX = maxX;
            //angAcc = offset == 0?-abs(angAcc):abs(angAcc);
            //dotA = -abs(dotA);
        }
        /*if(perturbation>0) { // handle perturbation
            if(perturbing > 0) {
                dotX += perturbDist/perturbLen*perturbDir[nextPerturb];
                perturbing--;
                if(perturbing == 0)
                    nextPerturb++;
            } else {
                if(nextPerturb<perturbCount && -dotY>=perturbCoord[nextPerturb]) {
                    if(perturbDir[nextPerturb] != 0)
                        perturbing = perturbLen;
                    else
                        nextPerturb++;
                }
            }
        }*/
        
        dotY -= 1;
        // draw
        translate(windowWidth/2, windowHeight*2/3 - dotY*scaling);
        clear();
        background('white');
        stroke('black');
        strokeWeight(4);
        noFill();
        rect(-maxX*scaling, -(maxX-dotY)*scaling, maxX*scaling*2, maxX*scaling*1.5);
        let high = int(maxX*blank[blanknum]-dotY);
        drawCurve(lines, -dotY-1, min(high,(blanknum+1)*plen));
        drawBike();
        drawTrace();
        if(movin)
            error += pathError;
        // save framerate
        fr = frameRate();
        if(frameNum%10==0)
            frBuffer = fr.toFixed();
        stroke('black');
        fill('black');
        textSize(12);
        strokeWeight(1);
        text("FPS: "+frBuffer, maxX*scaling-50, -(maxX-dotY)*scaling+10);
            
        fps += fr;
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
function linearError() { // horizontal distance to trajectory
    if(dotY>0 || -dotY>=lines.length)
        return 0;
    return Math.abs(dotX-lines[-dotY]);
}
function sinuousCurve(len, isTest) { // generate trajectory, isTest: 0=test, 1=train
    let start = 0;
    var ampl;
    var freq;
    var repeat;
    if(isTest==0) {
        ampl = amplitudes[1];
        freq = frequency[1];
        repeat = blank.length;
    } else {
        ampl = amplitudes[0];
        freq = frequency[0];
        repeat = blank.length;
    }
    if(isTest==0) { // generate the same sub-trajectories for testing
        var points = [];
        for(let i=0; i<len; i++) {
            X = 0;
            for(let j=0; j<ampl.length; j++) {
                X += width_x/2*ampl[j]*sin(2*PI*start*freq[j]);
            }
            points.push(X);
            start += 0.01;
        }
        var paths = [];
        pOffsets = {startpos:[]};
        for(let i=0; i<repeat; i++) { // generate each sub-trajectory
            let offset = int(random()*points.length);
            pOffsets.startpos.push(offset);
            var path = arrayRotate(points.slice(0), offset); // randomize starting position for each sub-trajectory
            paths = paths.concat(Array(straightLen).fill(path[0]).concat(path));
        }
        return paths;
    } else { // generate different sub-trajectories for training
        var paths = [];
        pOffsets = {};
        for(let k=0; k<repeat; k++) { // generate each sub-trajectory
            let points = [];
            let offset = Array(ampl.length).fill().map(() => random()*2*PI);
            for(let i=0; i<len; i++) {
                X = 0;
                for(let j=0; j<ampl.length; j++) {
                    X += width_x/2*ampl[j]*sin(2*PI*start*freq[j]+offset[j]);
                }
                points.push(X);
                start += 0.01;
            }
            pOffsets[k.toString()] = offset;
            var path = points.slice(0);
            paths = paths.concat(Array(straightLen).fill(path[0]).concat(path));
        }
        return paths;
    }
}
function arrayRotate(arr, count) { // rotates array, ex. arrayRotate([0, 1, 2, 3, 4, 5], 2) -> [2, 3, 4, 5, 0, 1]
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
function drawCurve(coords, start, end) {
    noFill();
    let startFix = start;
    if(startFix < 0)
        startFix = 0;
    let endFix = end;
    if(endFix > coords.length)
        endFix = coords.length;
    stroke('grey');
    strokeWeight(6);
    for(let i = startFix+1; i<endFix; i++) {
        line(coords[i-1]*scaling, (1-i)*scaling, coords[i]*scaling, -i*scaling);
    }
    noStroke();
    fill('lightgray')
    rect(-maxX*scaling+2, (maxX/2+dotY)*scaling, 2*maxX*scaling-4, (2-maxX/2)*scaling);
    if(blank[blanknum]<0.9) {
        fill('grey');
        rect(-maxX*scaling+2, (dotY-maxX)*scaling, 2*maxX*scaling-4, maxX*(1-blank[blanknum])*scaling);
    }
}
function drawBike() {
    if(!movin) {
        stroke('grey');
        fill('grey');
    } else if(offset == 0) {
        stroke('blue');
        fill('blue');
    } else {
        stroke('red');
        fill('red');
    }
    strokeWeight(3);
    let heading = dotA;
    let x = dotX*scaling;
    let y = dotY*scaling;
    let A = dotU*20;
    let d = dotU*4800/PI;
    triangle(x+15*sin(heading+A), y-15*cos(heading+A), x+6*cos(heading+A), y+6*sin(heading+A), x-6*cos(heading+A), y-6*sin(heading+A));
    noFill();
    curve(x+d*cos(heading),y+d*sin(heading), x, y, x-45*sin(heading), y+45*cos(heading), x-45*sin(heading)+d*cos(heading), y+45*cos(heading)+d*sin(heading));
}
function drawTrace() { // draw trace behind triangle
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
        ellipse(trace[i].x*scaling, trace[i].y*scaling, 2, 2);
        transparency += increment;
    }
}
function pause() { // pause due to inactivity
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
    instr.html(`<br>Are you still there?<br><br>The experiment has been paused because we cannot detect any cursor movement for a few seconds.<br><br>Click the Continue button when you are ready to resume.`);
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
    htmlDiv.show();
    timerCount = 60;
    instr.html(`<br>Let's take a ${len} minute break.<br><br>${timerCount}`);
    select('#startBt').hide();
    timer = setInterval(countDown, 1000);
    
}
function countDown() { // timer countdown for break
    if(--timerCount>0) {
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br><br>${timerCount}`);
    } else {
        let btn = document.getElementById("startBt");
        clearInterval(timer);
        sessionComplete++;
        select('#endInstr').html(`<br>Now we will introduce the Red Fish!<br><br>At each test, you will be tested on both blue and red fish.<br>The Red fish may not behave in an intuitive way at first. But if you keep on trying to follow the grey path, you will see that your performance will improve`);
        btn.style.display = 'block';
        btn.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
    }
}
function handleMouseMove(e) {
    if(movin) {
        var scaledMovement;
        inactivity = 0;
        scaledMovement = e.movementX/5000;
        //scaledMovement = e.movementX/20/dpi;
        angAcc += scaledMovement;
        angAcc = fixBetween(angAcc, -maxA/20, +maxA/20);
    }
}
function handleClick() {
    startSession();
}
function moveNoise(mode) {
    return 0;
    /*const mean = 0;
    const std = 0.05;
    return randomGaussian(mean, std);*/
}
function computeSessionTotal() {
    var t=0;
    let x=[2,3,1,1,2,3,1,1];
    for(let i=0;i<totalTrainBlocks;i++) {
        if(trainBlocks[i]<0)
            t++;
        else
            t+=x[trainBlocks[i]];
    }
    return t;
}
function forceQuit() { // force quit experiment because of low frame rate
    select('#endDiv').hide();
    remove();
    show('container-failed', 'container-exp');
    document.getElementById("container-exp").onmousemove = null;
    document.body.style.overflow = 'auto';
    helpEnd();
}
function startGame() {
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    h = min(windowHeight*1/6, 100);
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x/0.75*0.8;
    scaling = sx < sy? sx:sy;
    select('#instrDiv').hide();
    totalTrainBlocks = trainBlocks.length;
    sessionComplete = 0;
    maxA = PI/2;
    highscore = [-1,-1];
    sessionTotal = computeSessionTotal();
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
    // set scaling depending on screen size
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x/0.75*0.8;
    scaling = sx < sy? sx:sy;
}