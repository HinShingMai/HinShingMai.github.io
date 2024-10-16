let ver = 0.1;
let cnv;
let dpi = -1;
let currentTrainBlock = 0;
let trainBlocks = [0,1,-1,1,-1,1,-1,1,-1,1,-1,1,-1,1,-10,1,2];
/*
-n: n-minutes break
0: no path normal familiarization block
4: normal training block
5: reverse training block
6: normal testing block
7: reverse testing block
*/
let totalTrainBlocks;
let amplitudes = [[1/2,-1/4]];
let frequency = [[1/3,2/3]];
let offsets = [0,1,-1];
let frameNum = 0; // Number of frames in the current session
var dotX;
var dotY;
//var dotV = [1.0, 1.0];
var dotA;
var dotB;
var maxY = 300;
var width_x = 240;
var scaling_base;
var scaling;
var lines;
var lLines;
var rLines;
var currentSession;
var sessions;
var blockType;
var isDraw;
var dis;
var vDis;
var nse;
var dis_temp;
var vDis_temp;
var h;
var maxA;
var maxPoints;
var time;
var fps;
var error;
var errors;
var path = null;
var pathWidth = 15;
var trace;
var traceBuffer;
var traceLen = 10;
var inactivity;
var sessionsType;
var sessionComplete;
var sessionTotal;
var straightLen = 0;
var blanknum;
var blank;
var highscore;
var timer;
var timerCount;
var movin;
var frBuffer;
var plen;
var heading;
var wHeight;
var sMargin = 15;
var SAT1_score;
var SAT2_score;
function setup() {
    isDraw = false;
    frameRate(60);
    randomSeed(1024);
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    // arrange sessions in a block
    /*
        4: normal testing session
        5: reverse testing session
        6: normal training session
        7: reverse training session
    */
    if(blockType<0) {
        startBreak(-blockType);
        return;
    } else {
        sessionsType = [blockType];
    }
    sessions = sessionsType.length;
    currentSession = 0;
    sessionInfo();
}
function sessionNext() {
    //isdraw = false;
    document.exitPointerLock();
    document.getElementById("container-exp").onmousemove = null;
    noLoop();
    clear();
    currentSession++;
    sessionComplete++;
    sessionInfo();
}
function startSession() {
    dotA = 0;
    dotB = 0;
    //maxY = width_x*0.625; //150
    isDraw = true;
    select('#container-exp').show()
    document.getElementById("container-exp").onmousemove = handleMouseMove;
    document.getElementById("container-exp").requestPointerLock();
    dis = []; 
    vDis = [];
    nse = [];
    dis_temp = [];
    vDis_temp = [];
    maxPoints = 0;
    if(sessionsType[currentSession] == 0) { // empty session
        isTest = false;
        maxPoints = 300;
        maxX = width_x*0.625; //150
        maxY = maxX*2;
        wHeight = maxY+2*sMargin;
        scaling = scaling_base;
        blank = 30;
        lines = straightLine(maxPoints);
        dotX = 0;
        dotY = -maxY/2;
    } else {
        maxPoints = 300;
        maxX = width_x*0.625; //150
        maxY = maxX*2;
        wHeight = maxY+2*sMargin;
        scaling = scaling_base;
        blank = 40; // 4 sub-sessions
        lines = sinuousCurve(maxPoints, sessionsType[currentSession]);
        dotX = 0;
        dotY = -maxY/2;
    }
    clear();
    blanknum = 0;
    frameNum = 0;
    error = [];
    errors = [];
    trace = [];
    traceBuffer = null;
    inactivity = 0;
    movin = false;
    fps = 0.0;
    frBuffer = 60.0;
    plen = maxPoints+straightLen;
    heading = 0;
    SAT1_score = null;
    SAT2_score = null;
    loop();
}
function sessionInfo() {
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    let plot = select('#plot');
    var mse;
    htmlDiv.show();
    if(lines==null) {
        mse = -1.0;
        plot.hide();
    } 
    else if(currentSession > 0) { // handles data
        mse = 0;
        isPlot = false;
        mse = 1.0*mse/errors.length;
        // Record data
        let avgfps = fps/dis.length;
        let blockData = {
            xh: lines,
            x: dis,
            y: vDis,
            n: nse,
            num: sessionComplete,
            type: sessionsType[currentSession-1],
            hori: blank,
            id: null,
            fps: fps/dis.length,
            version: ver,
            scale: scaling,
            percent: errors
        }
        console.log(blockData)
        //recordTrialSession(trialcollection, blockData);
        //subject.progress++;
        if(sessionComplete<2&&avgfps<50) { // Screen out participants
            forceQuit(1);
        }
        let msg;
        if(highscore<0) {
            let color = "blue";
            highscore = mse;
            msg = `<br><br>Best performance: <span style="color:${color};">${highscore.toFixed(1)}%</span>`;
        } 
        else if(mse>highscore) {
            let color = "blue";
            highscore = mse;
            msg = `<br><br>Congratulations! Your score improved better! Keep it up!<br><br>Best performance: <span style="color:${color};">${highscore.toFixed(1)}%</span>`;
        } else {
            let color = "red";
            msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance: <span style="color:${color};">${highscore.toFixed(1)}%</span>`;
        }
        plot.show();
        plot.html(msg);
    } else {
        mse = -1.0;
        plot.hide();
    }
    mse = mse.toFixed(1);
    select('#container-exp').hide()
    let button = document.getElementById("startBt");
    timer = setTimeout(()=>{select('#endInstr-span').html("Are you still there? Please click the button now or you will be disconnected due to inactivity.");document.getElementById("endInstr-span").style.color = "red";
                            timer = setTimeout(()=>{forceQuit(2);},60000);},60000);
    if(currentSession < sessions) { // proceed to next session
        testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
        let color = "blue";
        let desc;
        if(sessionsType[currentSession] == 0)
            desc = "First, please take some time to familiarize yourself with the controls.\nMove the arrow upwards along the white path."
        else if(sessionsType[currentSession] == 1)
            desc = "Train: try to follow the white path as closely as posible.";
        else
            desc = "Test: try to follow the white path as closely as posible.";
        if(mse < 0)
            instr.html(`<br><span style="color:${color};">${desc}</span><br><br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br><br><span id="endInstr-span">Click the Continue button to proceed.</span>`);
        else
            instr.html(`<br><span style="color:${color};">${desc}</span><br><br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br>Average Percentage in Path: ${mse}%<br><span id="endInstr-span">Click the Continue button to proceed.</span>`);
        butfunc = ()=>{plot.hide();select('#endDiv').hide();startSession();};
    } else { // end of a block
        if(currentTrainBlock+1 < totalTrainBlocks){ // proceed to next block
            if(mse < 0)
                instr.html(`<br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br><br><br><span id="endInstr-span">Click the Continue button to proceed to next training block.</span>`);
            else
                instr.html(`<br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br>Average Percentage in Path: ${mse}%<br><br><span id="endInstr-span">Click the Continue button to proceed to next training block.</span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else { // Final block, end game
            instr.html(`<br>Current Progress: ${sessionComplete} / ${sessionTotal} completed. ${int(sessionComplete/sessionTotal*100)}%<br>Average Percentage in Path: ${mse}%<br><br><span id="endInstr-span">Click the Continue button to proceed.</span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; endGame();};
        }
    }
    button.onclick = ()=>{clearTimeout(timer);butfunc();};
}
function draw() {
    if(isDraw) {
        if(movin) {
            if(-dotY >= plen) {
                dis.push(dis_temp);
                vDis.push(vDis_temp);
                errors.push(error);
                movin = false;
                if(blanknum < blank-1) { // next sub-session
                    blanknum++;
                    //dotY = 0;
                    //dotX = lines[-dotY];
                    dotA = 0.0;
                    dotB = 0.0;
                    dis_temp = [];
                    vDis_temp = [];
                    error = [];
                    frameNum = 0;
                    return;
                } else {
                    isDraw = false;
                    sessionNext();
                    return;
                }
            }
            //var noise = moveNoise(sessionsType[currentSession]);
            var noise = 0;
            
            // record trajectory
            dis_temp.push(dotX);
            vDis_temp.push(-dotY);
            //actx.push(dotA);
            //acty.push(dotB);
            //nse.push(noise);
            var inPath;
            if(lines == null) {
                let nextTarget =  famTargets[famTargetNext]; // nextTarget[x-coord, y-coords]
                inPath = false;
                if(nextTarget != null) {
                    if(-dotY >nextTarget[1]+5)
                        famTargetNext += 1;
                    else if(famTargetState[famTargetNext] == 0 && -dotY > nextTarget[1]-5 && Math.abs(dotX-nextTarget[0])<5) {
                        famTargetState[famTargetNext] = 1;
                        famScore += 1;
                    }
                }
            } else {
                var pathError = distToPath();
                inPath = pathError < pathWidth**2;
                error.push(pathError);
            }
            if(!inPath)
                inactivity++;
            if(frameNum%5 == 0) {
                if(traceBuffer != null)
                    trace.push(traceBuffer);
                if(trace.length > traceLen)
                    trace.shift();
                traceBuffer = {x: dotX, y: dotY};
            }
                
            if(inactivity > 120) {
                //isDraw = false;
                //pause();
            }
            // motion model
            /*
            if(dotA < -maxA) {
                dotA = -maxA;
            } else if(dotA > maxA) {
                dotA = maxA;
            }*/
            dotX += fixBetween(dotA,-10,10);
            if(dotX < -maxX) { // hits edge
                dotX = -maxX;
                dotA = 0; // mirrors motion when hitting edge
            } else if(dotX > maxX) {
                dotX = maxX;
                dotA = 0;
            }
            dotY += fixBetween(dotB,-10,0);
            if(dotA != 0 || dotB != 0)
                heading = 0.8*heading + 0.2*fixBetween(Math.atan2(dotA, -dotB),-PI/2,PI/2);
            //update SAT feedback
            let v = Math.sqrt(dotA**2+dotB**2);
            let e = Math.sqrt(pathError);
            //console.log(v+' '+e+' : '+v/e);
            SAT1_score[0] += v;
            SAT1_score[1] += pathError;
            SAT2_score[0] += v;
            SAT2_score[1] += e;
            // draw
            clear();
            background('black');
            stroke('white');
            strokeWeight(4);
            noFill();
            //let high = int(maxY-dotY);
            translate(windowWidth/2, windowHeight*(sMargin+maxY)/wHeight);
            rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);

            drawCurve(lines);
            drawBike(inPath, heading);
            drawTrace(inPath);
            // save framerate
            fr = frameRate();
            if(frameNum%10==0)
                frBuffer = fr.toFixed();
            /*stroke('black');
            fill('black');
            textSize(12);
            strokeWeight(1);
            text("FPS: "+frBuffer, maxY*scaling-50, -(maxY-dotY)*scaling+10);*/
            /*if(lines != null) {
                stroke('blue');
                fill('blue');
                textSize(18);
                strokeWeight(1);
                for(let i=0;i<errors.length;i++) {
                    text(errors[i].toFixed(1)+"%",0,maxY/2*scaling-12-18*i);
                }
                text("Percent in Path: ",0,maxY/2*scaling-72);
            }*/
            dotA = 0;
            dotB = 0;
            fps += fr;
            frameNum++;
        } else {
            // draw
            clear();
            background('black');
            stroke('white');
            strokeWeight(4);
            noFill();
            //let high = int(maxY-dotY);
            translate(windowWidth/2, windowHeight*(sMargin+maxY)/wHeight);
            rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);
            drawReturnCursor();
            frameNum++;
        }
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
function sinuousCurve(len, mode) { // generate trajectory
    var ampl;
    var freq;
    var repeat;
    ampl = amplitudes[0];
    freq = frequency[0];
    repeat = blank;
    let offset = offsets[mode];
    var X, X2;
    var paths = [];
    lLines = [];
    rLines = [];
    for(let k=0; k<repeat; k++) { // generate each sub-trajectory
        let start = 0;
        let points = [];
        var lPoints = [];
        var rPoints = [];
        for(let i=0; i<len; i++) {
            X = 0;
            X2 = 0;
            for(let j=0; j<ampl.length; j++) {
                X += offset*width_x/2*ampl[j]*sin(2*PI*start*freq[j]);
                X2 += offset*2*PI*freq[j]*0.01*width_x/2*ampl[j]*cos(2*PI*start*freq[j]);
            }
            points.push(X);
            let n = sqrt(X2**2 + 1); // normalizing constant
            lPoints.push({x: -1*pathWidth/n + X, y: X2*pathWidth/n});
            rPoints.push({x: 1*pathWidth/n + X, y: -X2*pathWidth/n});
            start += 0.01;
        }
        //pOffsets[k.toString()] = offset;
        var path = points.slice(0);
        var lPath = lPoints.slice(0);
        var rPath = rPoints.slice(0);
        //paths = paths.concat(Array(straightLen).fill(path[0]).concat(path));
        //lLines = lLines.concat(Array(straightLen).fill({x: path[0]-pathWidth, y: 0}).concat(lPath));
        //rLines = rLines.concat(Array(straightLen).fill({x: path[0]+pathWidth, y: 0}).concat(rPath));
        paths = path;
        lLines = lPath;
        rLines = rPath;
    }
    return paths;
}
function straightLine(len) {
    var mid = 0;
    var paths = Array(len).fill(mid);
    //lLines = Array(len).fill(mid-pathWidth);
    //rLines = Array(len).fill(mid+pathWidth);
    lLines = Array(len).fill({x: mid-pathWidth, y: 0});
    rLines = Array(len).fill({x: mid+pathWidth, y: 0});
    return paths;
}
function arrayRotate(arr, count) { // rotates array, ex. arrayRotate([0, 1, 2, 3, 4, 5], 2) -> [2, 3, 4, 5, 0, 1]
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
function drawCurve(coords) {
    if(coords!==null) {
        noFill();
        stroke('white');
        strokeWeight(6);
        for(let i = 1; i<coords.length; i++)
            line(coords[i-1]*scaling, (1-i)*scaling, coords[i]*scaling, -i*scaling);
        stroke('gray');
        strokeWeight(4);
        startFix2 = 1;
        endFix2 = coords.length;
        for(let i = startFix2+1; i<endFix2; i++) {
            line(lLines[i-1].x*scaling, -(i-1+lLines[i-1].y)*scaling, lLines[i].x*scaling, -(i+lLines[i].y)*scaling);
            line(rLines[i-1].x*scaling, -(i-1+rLines[i-1].y)*scaling, rLines[i].x*scaling, -(i+rLines[i].y)*scaling);
        }
    }
    stroke('lightgray');
    fill('lightgray');
    textSize(24);
    strokeWeight(1);
    textAlign(RIGHT);
    text(`${blanknum+1} / ${blank}`, (maxX-sMargin)*scaling, -sMargin*scaling);//-maxY*1/6*scaling
}
function drawBike(state, angle) { // state: true/false = inPath/outOfPath, angle: angle arrow is pointing at (0 is vertical up)
    var heading;
    if(state) {
        stroke('blue');
        fill('blue');
        /*textSize(18);
        strokeWeight(1);
        text(((error-straightLen)/maxPoints*100).toFixed(1)+"%", dotX*scaling + 60, dotY*scaling);*/
    } else {
        stroke('red');
        fill('red');
        /*if(lines != null) {
            textSize(18);
            strokeWeight(1);
            text(((error-straightLen)/maxPoints*100).toFixed(1)+"%", dotX*scaling + 60, dotY*scaling);
        }*/
    }
    strokeWeight(3);
    //let heading = 0;
    heading = angle;
    let x = dotX*scaling;
    let y = dotY*scaling;
    triangle(x+15*sin(heading), y-15*cos(heading), x+6*cos(heading), y+6*sin(heading), x-6*cos(heading), y-6*sin(heading));
    noFill();
    //curve(x+d*cos(heading),y+d*sin(heading), x, y, x-45*sin(heading), y+45*cos(heading), x-45*sin(heading)+d*cos(heading), y+45*cos(heading)+d*sin(heading));
}
function drawTrace(state) { // draw trace behind triangle, state: true/false = inPath/outOfPath
    var baseColor;
    if(!movin)
        baseColor = color('grey');
    else if(state)
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
function drawReturnCursor() {
    stroke('lightgray');
    fill('lightgray');
    rect(lines[0]-20*scaling, 0, 40*scaling, 15*scaling);
    ellipse(dotX*scaling, dotY*scaling, 20, 20);
    /*var d = ((dotX-lines[0])*scaling)**2 + (dotY*scaling)**2;
    var f = frameNum%100;
    if(d>10000 && d*f>640000) {
        d = Math.sqrt(d)/100-0.4;
        var a = Math.atan2(dotX*scaling-lines[0], -dotY*scaling);
        //var x = lines[0]+40*Math.sin(a);
        //var y = -40*Math.cos(a);
        var x = dotX*scaling-d*Math.sin(a)*f;
        var y = dotY*scaling+d*Math.cos(a)*f;
        //console.log(dotY);
        line(dotX*scaling-20*Math.sin(a),dotY*scaling+20*Math.cos(a), x,y);
        line(x,y ,x+10*Math.sin(a+PI/4),y-10*Math.cos(a+PI/4));
        line(x,y ,x+10*Math.sin(a-PI/4),y-10*Math.cos(a-PI/4));
    }*/
    textSize(24);
    strokeWeight(1);
    textAlign(CENTER);
    if(SAT1_score == null)
        text("Move the dot into the box at the bottom of the screen.", 0, -maxY*2/3*scaling);
    else {
        //let n = errors[errors.length-1].length;
        text(`SAT1 score: ${(SAT1_score[0]/SAT1_score[1]).toFixed(2)}, SAT2 score: ${(SAT2_score[0]/SAT2_score[1]).toFixed(2)}\n\nMove the dot into the box at the bottom of the screen.`, 0, -maxY*2/3*scaling);
        //text(`SAT score: ${(SAT2_score[0]/SAT2_score[1]).toFixed(2)}\n\nMove the dot into the box at the bottom of the screen.`, 0, -maxY*2/3*scaling);
    }
}
function pause() { // pause due to inactivity
    document.exitPointerLock();
    document.getElementById("container-exp").onmousemove = null;
    noLoop();
    clear();
    //isdraw = false;
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    select('#container-exp').hide()
    let button = document.getElementById("startBt");
    instr.html(`<br>Are you still there?<br><br>The experiment has been paused because we cannot detect any cursor movement for a few seconds.<br><br><span id="endInstr-span">Click the Continue button to return to the experiment.</span>`);
    timer = setTimeout(()=>{select('#endInstr-span').html("Please click the button now or you will be disconnected due to inactivity.");document.getElementById("endInstr-span").style.color = "red";
                            timer = setTimeout(()=>{forceQuit(2);},60000);},120000);
    butfunc = ()=>{select('#endDiv').hide();resume();};
    button.onclick = ()=>{clearTimeout(timer);butfunc();};
}
function resume() {
    isDraw = true;
    inactivity = 0;
    select('#container-exp').show()
    document.getElementById("container-exp").requestPointerLock();
    clear();
    loop();
}
function startBreak(len) { // len-minutes break
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    timerCount = 60*len;
    graceTime = 120; // participants have 120 seconds to click next button after break timer runs out
    instr.html(`<br>Let's take a ${len} minute break.<br><br>${len} : 00`);
    select('#startBt').hide();
    timer = setInterval(breakCountDown, 1000);
}
function breakCountDown() { // timer countdown for break
    timerCount--;
    if(timerCount>0) {
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br>Please come back within ${-trainBlocks[currentTrainBlock]+graceTime/60} minutes or you will be disconnected due to inactivity.
                                    <br>${Math.floor(timerCount/60)} : ${String(timerCount%60).padStart(2,'0')}`);
    } else if(timerCount == 0) {
        let btn = document.getElementById("startBt");
        select('#endInstr').html(`<br><br><br>Please click the button and proceed with the experiment.<br>`);
        btn.style.display = 'block';
        btn.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; clearInterval(timer);sessionComplete++; trainBlockStart();};
    } else {
        if(graceTime+timerCount==60) {
            select('#endInstr').html(`<br><br><br><span style="color:red;">Are you still there? Please click the button now or you will be disconnected due to inactivity.</span>`); // show timer : <br><span style="color:red;">${Math.floor((graceTime+timerCount)/60)} : ${String((graceTime+timerCount)%60).padStart(2,'0')}</span>
        } else if(graceTime+timerCount==-1) { // timeout
            clearInterval(timer);
            butfunc = ()=>{select('#endDiv').hide(); currentTrainBlock++; sessionComplete++; trainBlockStart();};
            forceQuit(2);
        }
    }
}
function startBackTimer() { // starts inactivity background timer
    timerCount = 120;
    timer = setTimeout(inactivityTimer, 60000);
}
function handleMouseMove(e) {
    if(movin) {
        var scaledMovement;
        inactivity = 0;
        scaledMovementX = e.movementX/5;
        scaledMovementY = e.movementY/5;
        dotA += scaledMovementX;
        dotB += scaledMovementY;
        //dotA = fixBetween(dotA, -maxA, +maxA);
    } else { //translate(windowWidth/2, windowHeight);
        //dotX += e.movementX/5;
        //dotY += e.movementY/5;
        dotX = fixBetween(dotX+e.movementX/5,-maxX,maxX);
        dotY = fixBetween(dotY+e.movementY/5,-maxY-sMargin,sMargin);
        let x = dotX - lines[0];
        let y = dotY;
        //console.log(x+" "+y)
        if(x>-20 && x<20 && y>0 && y<15) {
            //document.getElementById("container-exp").requestPointerLock();
            //noCursor();
            dotX = lines[0];
            dotY = 0.0;
            SAT1_score = [0.0,0.0];
            SAT2_score = [0.0,0.0];
            movin = true;
        }
    }
}
function moveNoise(mode) {
    return 0;
    /*const mean = 0;
    const std = 0.05;
    return randomGaussian(mean, std);*/
}
function computeSessionTotal() {
    var t=0;
    let x=[1,1,1,1,1,1,1,1];
    for(let i=0;i<totalTrainBlocks;i++) {
        if(trainBlocks[i]<0)
            t++;
        else
            t+=x[trainBlocks[i]];
    }
    return t;
}
function forceQuit(reason) { // force quit experiment because of : 1. low frame rate 2. taken a break too long
    select('#endDiv').hide();
    select('#failed-'+reason).show();
    show('container-failed', 'container-exp');
    document.getElementById("container-exp").onmousemove = null;
    document.body.style.overflow = 'auto';
    if(reason == 2) {
        timerCount = 120;
        timer = setTimeout(()=>{show('failed-2-disqualify', 'failed-2-return');remove();helpEnd();}, timerCount*1000);
        let btn = document.getElementById("returnBt");
        btn.onclick = ()=>{select('#failed-2').hide();show('container-exp', 'container-failed');document.body.style.overflow = 'hidden';clearTimeout(timer);butfunc();};
    } else {
        remove();
        helpEnd();
    }
}
function startGame() {
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x*0.8/(1+sMargin*2/maxY);
    scaling_base = sx < sy? sx:sy;
    select('#instrDiv').hide();
    totalTrainBlocks = trainBlocks.length;
    sessionComplete = 0;
    maxA = PI/2;
    highscore = [-1];
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
    h = min(windowHeight*1/6, 100);
    // set scaling depending on screen size
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x*0.8/(1+sMargin*2/maxY);
    scaling_base = sx < sy? sx:sy;
    scaling = scaling_base;
}
function show(shown, hide) {
    document.getElementById(shown).style.display = 'block';
    document.getElementById(hide).style.display = 'none';
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    return false;
}
function helpEnd() {}