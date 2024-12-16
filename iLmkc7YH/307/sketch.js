let ver = 0.2;
let cnv;
let dpi = -1;
let currentTrainBlock = 0;
//let trainBlocks = [0,1,-1,1,-1,1,-1,1,-1,1,-10,1,2,0];
let trainBlocks = [0,1,2];
/*
-n: n-minutes break
0: no path normal familiarization block
4: normal training block
5: reverse training block
6: normal testing block
7: reverse testing block
*/
let totalTrainBlocks;
//let amplitudes = [[1/2,-1/4]];
//let frequency = [[1/3,2/3]];
let amplitudes = [[1/2]];
let frequency = [[1/6]];
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
var scores;
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
var delay;
var frBuffer;
var plen;
var heading;
var wHeight;
var sMargin = 15;
var mode;
var modes;
var SAT1_score;
var score_max;
var score_base;
var speed_scale;
var dis_instr;
var feedback_sc;
var butfunc;
var keyfunc;
function setup() {
    isDraw = false;
    frameRate(60);
    randomSeed(1024);
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    // arrange sessions in a block
    /*  0: straight line
        1: learning block
        2: mirrored track*/
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
    isDraw = true;
    select('#container-exp').show()
    document.getElementById("container-exp").requestPointerLock();
    dis = []; 
    vDis = [];
    nse = [];
    dis_temp = [];
    vDis_temp = [];
    maxPoints = 0;
    if(sessionsType[currentSession] == 0) { // familiarization session
        //document.getElementById("container-exp").onmousemove = calibrateMouse;
        maxPoints = 300;
        maxX = width_x*0.625; //150
        maxY = maxX*2;
        wHeight = maxY+2*sMargin;
        scaling = scaling_base;
        if(currentTrainBlock==0) {
            document.onkeyup = handleCalibrationKey;
            mode = 2; // 0: normal, 1: familiarization, 2/3: mouse calibration, 4: no-feedback straight, 5: traj feedback trial, 6: traj feedback straight
            modes = [1,1,1,4,4];
            speed_base = -1; // scaling factor on cursor speed, should be >0 once calibrated
            movin = -120; // 1: in trial, 0: awaiting cursor to move back to starting position(resetting), <0: inter-trial cooldown
        } else {
            document.getElementById("container-exp").onmousemove = handleMouseMove;
            mode = -1;
            modes = Array(5).fill(1);
            movin = 0;
        }
        lines = straightLine(maxPoints);
        dotX = 0;
        dotY = -maxY/2;
    } else {
        document.getElementById("container-exp").onmousemove = handleMouseMove;
        mode = -1;
        if(sessionsType[currentSession] == 1)
            modes = pesudoRandom(4,true);
        else
            modes = Array(40).fill(0);
        //modes = pesudoRandom(5,true);
        movin = 0;
        maxPoints = 300;
        maxX = width_x*0.625; //150
        maxY = maxX*2;
        wHeight = maxY+2*sMargin;
        scaling = scaling_base;
        lines = sinuousCurve(maxPoints, sessionsType[currentSession]);
        dotX = 0;
        dotY = -maxY/2;
    }
    blank = modes.length;
    clear();
    dis_instr = 1;
    blanknum = 0;
    frameNum = 0;
    error = [];
    errors = [];
    trace = [];
    traceBuffer = null;
    fps = 0.0;
    frBuffer = 60.0;
    plen = maxPoints+straightLen;
    heading = 0;
    SAT1_score = null;
    SAT2_score = null;
    delay = -180;
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
            bNum: sessionComplete,
            type: sessionsType[currentSession-1],
            len: blank,
            id: null,
            fps: fps/dis.length,
            version: ver,
            scale: scaling,
            error: errors,
            score: scores.slice(scores.length-blank, scores.length),
            baseSp: speed_base
        }
        console.log(blockData)
        //recordTrialSession(trialcollection, blockData);
        //subject.progress++;
        if(sessionComplete<2&&avgfps<50) { // Screen out participants
            forceQuit(1);
        }
    } else {
        mse = -1.0;
        plot.hide();
    }
    mse = mse.toFixed(1);
    select('#container-exp').hide()
    if(currentSession < sessions) { // proceed to next session
        let button = document.getElementById("startBt");
        timer = setTimeout(()=>{select('#endInstr-span').html("Are you still there? Please click the button now or the experiment will terminate.");document.getElementById("endInstr-span").style.color = "red";
                                timer = setTimeout(()=>{forceQuit(2);},60000);},60000);
        testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
        let color = "blue";
        let desc;
        if(sessionsType[currentSession] == 0) {
            if(currentTrainBlock == 0)
                desc = "First, lets familiarize ourselves with the experiment."
            else
                desc = "Baseline: let's try the straight line track again."
        }
        else if(sessionsType[currentSession] == 1)
            desc = "Train: time to learn how to do the task!";
        else
            desc = "Test: now it is time to try a different track!";
        instr.html(`<br><span style="color:${color};">${desc}</span><br><br><span id="endInstr-span">Press Space Bar to proceed.</span>`);
        butfunc = ()=>{plot.hide();select('#endDiv').hide();startSession();};
        //button.onclick = ()=>{clearTimeout(timer);butfunc();};
        document.onkeyup = handleKeyReleased;
        keyfunc = ()=>{clearTimeout(timer);butfunc();};
    } else { // end of a block
        if(currentTrainBlock+1 < totalTrainBlocks){ // proceed to next block
            plot.hide();
            select('#endDiv').hide();
            currentTrainBlock++;
            trainBlockStart();
        } else { // Final block, end game
            let button = document.getElementById("startBt");
            instr.html(`<br>Great Work! We are almost done.<br><br><span id="endInstr-span">Press Space Bar to proceed.</span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; endGame();};
            //button.onclick = ()=>{butfunc();};
            document.onkeyup = handleKeyReleased;
            keyfunc = butfunc;
        }
    }
}
function draw() {
    if(isDraw) {
        if(movin>0) {
            if(delay == -1) {
                // record trajectory
                dis_temp.push(dotX);
                vDis_temp.push(-dotY);
                //actx.push(dotA);
                //acty.push(dotB);
                //nse.push(noise);
                var inPath;
                var pathError = distToPath();
                inPath = pathError < pathWidth**2;
                error.push(pathError);
                //if(-dotY >= plen) { // check if reached the goal
                if(-dotY+30*cos(heading)/scaling >= plen) {
                    dis_temp.push(dotX+30*sin(heading)/scaling); // save tip of triangle as final coordinate
                    vDis_temp.push(-dotY+30*cos(heading)/scaling);
                    dis.push(dis_temp);
                    vDis.push(vDis_temp);
                    errors.push(error);
                    if(mode == 0 || mode == 5) {
                        let mean_speed = SAT1_score[0]/SAT1_score[2]; // SAT_score = [sum of speed, sum of error, n]
                        let mean_error = SAT1_score[1]/SAT1_score[2];
                        //let sc = 125/(mean_error+25)//mean_speed/(mean_error+25);
                        //scores.push(sc);
                        //scores.sort();
                        movin = -120;
                        let score = 275/(mean_error+225)-0.03;
                        scores.push(score);
                        score_max = fixBetween(score*100, 0, 100).toFixed(0);
                        feedback_sc = fixBetween(Math.floor((score-0.05)/0.15), 0, 5);
                    } else
                        movin = -60;
                    blanknum++;
                    dotA = 0.0;
                    dotB = 0.0;
                    error = [];
                    frameNum = 0;
                    return;
                }
                if(frameNum%5 == 0) {
                    if(traceBuffer != null)
                        trace.push(traceBuffer);
                    if(trace.length > traceLen)
                        trace.shift();
                    traceBuffer = {x: dotX, y: dotY};
                }
                // motion model
                dotA = fixBetween(dotA,-10,10);
                dotX += dotA;
                if(dotX < -maxX) { // hits edge
                    dotX = -maxX;
                    dotA = 0; // mirrors motion when hitting edge
                } else if(dotX > maxX) {
                    dotX = maxX;
                    dotA = 0;
                }
                dotB = fixBetween(dotB,-10,0);
                dotY += dotB;
                if(dotA != 0 || dotB != 0)
                    heading = 0.8*heading + 0.2*fixBetween(Math.atan2(dotA, -dotB),-PI/2,PI/2);
                //update SAT feedback
                let v = Math.sqrt(dotA**2+dotB**2);
                if(mode == 0 || mode == 5) {
                    /*SAT1_score[0] += v;
                    SAT1_score[1] += pathError;
                    SAT1_score[2] += 1;*/
                    SAT1_score[0] += v*dotB;
                    SAT1_score[1] += pathError*dotB;
                    SAT1_score[2] += dotB;
                }
            } else {
                delay -= 1;
                heading = 0;
                inPath = true;
            }
            // draw
            clear();
            background('black');
            stroke('white');
            strokeWeight(4);
            noFill();
            translate(windowWidth/2, windowHeight*(sMargin+maxY)/wHeight);
            rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);
            if(mode == 4 || mode == 0 || mode == 5) { // nofeedback trials
                if(delay == -1) {
                    drawGoal();
                    drawCurve(lines);
                } else {
                    if(dis_instr > 0)
                        drawInstr();
                    drawBike(inPath, heading);
                }
            } else {
                if(delay == -1) {
                    drawGoal();
                    drawCurve(lines);
                } else if(dis_instr > 0)
                    drawInstr();
                drawBike(inPath, heading);
                drawTrace(inPath);
            }
            // save framerate
            fr = frameRate();
            dotA = 0;
            dotB = 0;
            fps += fr;
            frameNum++;
        } else {
            // draw reset trials after each learning trial
            clear();
            background('black');
            stroke('white');
            strokeWeight(4);
            noFill();
            translate(windowWidth/2, windowHeight*(sMargin+maxY)/wHeight);
            rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);
            drawReturnCursor();
            frameNum++;
            if(movin<0)
                movin += 1;
            else if(movin==0) {
                if(delay > 0)
                    delay -= 1;
                else if(delay==0) {
                    if(blanknum < blank) {
                        dotX = lines[0];
                        dotY = 0.0;
                        dis_temp = [];
                        vDis_temp = [];
                        SAT1_score = [0.0,0.0,0];
                        //SAT2_score = [0.0,0.0,0];
                        frameNum = 0;
                        movin = 1;
                        let next_mode = modes[blanknum];
                        if(next_mode==4) {
                            dis_instr = 2;
                            delay = 240;
                        } else if(mode==-1) { //next_mode!=mode
                            if(next_mode==1) {
                                dis_instr = 3;
                                delay = 180;
                            } else {
                                dis_instr = 1;
                                delay = 180;
                            }
                        } else {
                            dis_instr = 0;
                            delay = 30;
                        }
                        mode = next_mode;
                    } else {
                        isDraw = false;
                        sessionNext();
                        return;
                    }
                } else {
                    let x = dotX - lines[0];
                    let y = dotY;
                    if(x>-30 && x<30 && y>0 && y<20) 
                        delay = 30;
                }
            }
        }
        stroke('gray');
        fill('gray');
        textSize(12);
        strokeWeight(1);
        text(`${currentTrainBlock} - ${blanknum}/${blank}`, maxX*scaling-50, sMargin*scaling-10);//sMargin*scaling+10
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
function linearError() { // horizontal distance to trajectory
    if(lines==null || dotY>0 || -dotY>=lines.length+1)
        return 0;
    return (dotX-lines[Math.floor(-dotY)])**2;
}
function getMeanStd(array) { // returns [mean, std]
  if (array.length < 2) {
    return undefined;
  }
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return [mean, Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1),
  )];
}
function sinuousCurve(len, mod) { // generate trajectory
    var ampl;
    var freq;
    var repeat;
    ampl = amplitudes[0];
    freq = frequency[0];
    repeat = blank;
    let offset = offsets[mod];
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
        var path = points.slice(0);
        var lPath = lPoints.slice(0);
        var rPath = rPoints.slice(0);
        paths = path;
        lLines = lPath;
        rLines = rPath;
    }
    return paths;
}
function straightLine(len) {
    var mid = 0;
    var paths = Array(len).fill(mid);
    lLines = Array(len).fill({x: mid-pathWidth, y: 0});
    rLines = Array(len).fill({x: mid+pathWidth, y: 0});
    return paths;
}
function arrayRotate(arr, count) { // rotates array, ex. arrayRotate([0, 1, 2, 3, 4, 5], 2) -> [2, 3, 4, 5, 0, 1]
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
function pesudoRandom(len, noFirst) { // schedules 10*len no-feedback trials with 1 feedback in each 10 feedback trials. noFirst: Do not put no-feedback at first trial
    var flag = noFirst;
    var arr = [];
    for(let i=0;i<len;i++) {
        let arr_8 = Array(10).fill(0);
        let idx_8 = Array.from(Array(11).keys());
        if(flag)
            idx_8.shift();
        let choice = Math.floor(Math.random() * idx_8.length);
        arr_8.splice(idx_8[choice], 0, 5);
        arr = arr.concat(arr_8);
        if(arr_8[arr_8.length-1] == 5)
            flag = true;
        else
            flag = false;
    }
    return arr;
}
function drawGoal() {
    if(movin > 0) {
        fill('white');
        stroke('white');
        rect(-maxX*scaling, -(maxY+sMargin)*scaling, 2*maxX*scaling, sMargin*scaling); // draw goal area
        stroke('blue');
        line(maxX*scaling,0,maxX*scaling,dotY*scaling);
        line(-maxX*scaling,0,-maxX*scaling,dotY*scaling);
    } else {
        fill('blue');
        stroke('blue');
        rect(-maxX*scaling, -(maxY+sMargin)*scaling, 2*maxX*scaling, sMargin*scaling); // draw goal area
        line(maxX*scaling,0,maxX*scaling,-maxY*scaling);
        line(-maxX*scaling,0,-maxX*scaling,-maxY*scaling);
    }
    /*if(mode == 4) {
        stroke('blue');
        strokeWeight(8);
        line(maxX*scaling,0,maxX*scaling,dotY*scaling);
        line(-maxX*scaling,0,-maxX*scaling,dotY*scaling);
    }*/
}
function drawInstr() {
    fill('white');
    stroke('white');
    textSize(Math.floor(10*scaling));
    strokeWeight(1);
    textAlign(CENTER);
    if(dis_instr == 1) {
        text("Try to trace the curved path without the cursor.", 0, -maxY*2/3*scaling);
    } else if(dis_instr == 2) {
        text("No-Feedback: In most of the trials, the cursor is not displayed.\n"+
        "You need to guess your position.", 0, -maxY*2/3*scaling);
    } else if(dis_instr == 3) {
        text("Follow the white path as accurately as you can.", 0, -maxY*2/3*scaling);
    }
}
function drawCurve(coords) {
    if(coords!==null) {
        stroke('white');
        strokeWeight(6);
        for(let i = 1; i<coords.length; i++)
            line(coords[i-1]*scaling, (1-i)*scaling, coords[i]*scaling, -i*scaling);
        /*stroke('gray');
        strokeWeight(4);
        startFix2 = 1;
        endFix2 = coords.length;
        for(let i = startFix2+1; i<endFix2; i++) {
            line(lLines[i-1].x*scaling, -(i-1+lLines[i-1].y)*scaling, lLines[i].x*scaling, -(i+lLines[i].y)*scaling);
            line(rLines[i-1].x*scaling, -(i-1+rLines[i-1].y)*scaling, rLines[i].x*scaling, -(i+rLines[i].y)*scaling);
        }*/
    }
}
function drawBike(state, angle) { // state: true/false = inPath/outOfPath, angle: angle arrow is pointing at (0 is vertical up)
    var heading;
    if(delay> -1) {
        stroke('gray');
        fill('gray');
    } else if(state===false) {
        stroke('red');
        fill('red');
    } else {
        stroke('blue');
        fill('blue');
    }
    strokeWeight(3);
    //let heading = 0;
    heading = angle;
    let x = dotX*scaling;
    let y = dotY*scaling;
    triangle(x+30*sin(heading), y-30*cos(heading), x+12*cos(heading), y+12*sin(heading), x-12*cos(heading), y-12*sin(heading));
    noFill();
    //curve(x+d*cos(heading),y+d*sin(heading), x, y, x-45*sin(heading), y+45*cos(heading), x-45*sin(heading)+d*cos(heading), y+45*cos(heading)+d*sin(heading));
}
function drawTrace(state) { // draw trace behind triangle, state: true/false = inPath/outOfPath
    var baseColor;
    if(movin<1) {
        strokeWeight(8);
        baseColor = color('blue');
    } else {
        strokeWeight(4);
        if(state)
            baseColor = color('blue');
        else
            baseColor = color('red');
    }
    stroke(baseColor);
    for(var i=1;i<dis_temp.length;i++)
        line(dis_temp[i-1]*scaling,-vDis_temp[i-1]*scaling,dis_temp[i]*scaling,-vDis_temp[i]*scaling);
        //line(coords[i-1]*scaling, (1-i)*scaling, coords[i]*scaling, -i*scaling);
}
function drawReturnCursor() {
    if(mode == 2) { // during mouse calibration
        stroke('lightgray');
        fill('lightgray');
        textSize(Math.floor(10*scaling));
        strokeWeight(1);
        textAlign(CENTER);
        text(`To measure your mouse sensitivity, we need you to: \nPress space and move your mouse one credit card length upwards.\nYou can use any card to help you with measurement. \n\nPress space on your keyboard to begin calibration...`, 0, -maxY*2/3*scaling);
        return;
    } else if(mode == 3) {
        stroke('lightgray');
        fill('lightgray');
        textSize(Math.floor(10*scaling));
        strokeWeight(1);
        textAlign(CENTER);
        text(`Move your mouse one credit card length (8.5cm) upwards.\n\nPress space again when you are done moving.\nPress r to go back or restart calibration.`, 0, -maxY*2/3*scaling);
        return;
    }
    if(movin==0) {
        stroke('lightgray');
        fill('lightgray');
        if(delay<0) {
            rect(lines[0]-30*scaling, 0, 60*scaling, 20*scaling);
            ellipse(dotX*scaling, dotY*scaling, 30, 30);
        } else {
            stroke('blue');
            fill('blue');
            rect(lines[0]-30*scaling, 0, 60*scaling, 20*scaling);
            ellipse(dotX*scaling, dotY*scaling, 30, 30);
            stroke('lightgray');
            fill('lightgray');
        }
        if(frameNum > 600) {
            textSize(Math.floor(12*scaling));
            strokeWeight(1);
            textAlign(CENTER);
            text("Move the dot into the box at the bottom of the screen.", 0, -maxY*2/3*scaling);
        }
    } else {
        if(blanknum<1) {
            stroke('lightgray');
            fill('lightgray');
            strokeWeight(1);
            textAlign(CENTER);
            textSize(Math.floor(10*scaling));
            text(`follow the white path as fast and as accurately as you can.`, 0, -maxY*2/3*scaling);
        } else {
            drawGoal();
            drawCurve(lines);
            if(mode == 1 || mode == 5)
                drawTrace(true);
            if(mode == 0 || mode == 5) {
                strokeWeight(1);
                textAlign(CENTER);
                textSize(Math.floor(12*scaling));
                if(feedback_sc>=0) {
                    //let msg = ["Be More Accurate!","Be More Accurate!","Nice!","Nice!","Good!","Very Good!"];
                    let color = ["red","orange","lightgray","lightgray","yellow","green"];
                    stroke(color[feedback_sc]);
                    fill(color[feedback_sc]);
                    let percentage = score_max;
                    //text(`${msg[feedback_sc]}\nYour Score: ${percentage}%`, 0, -maxY*scaling*0.7);
                    text(`\nYour Score: ${percentage}%`, 0, -maxY*scaling*0.7);
                }
            }
        }
    }
}
function startBreak(len) { // len-minutes break
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    timerCount = 60*len;
    graceTime = 120; // participants have 120 seconds to click next button after break timer runs out
    instr.html(`<br>Let's take a ${len} minute break.<br><br>${len} : 00`);
    timer = setInterval(breakCountDown, 1000);
}
function breakCountDown() { // timer countdown for break
    timerCount--;
    if(timerCount>10) {
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br>Please make sure you come back before ${-trainBlocks[currentTrainBlock]+graceTime/60} minutes or the experiment will terminate.`);
    } else if(timerCount>0) {
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br>Please make sure you come back before ${-trainBlocks[currentTrainBlock]+graceTime/60} minutes or the experiment will terminate.
                                    <br><p style="font-size:10vw;color:red;">0 : ${String(timerCount%60).padStart(2,'0')}</p>`);
    } else if(timerCount == 0) {
        select('#endInstr').html(`<br><br><br>Press Space Bar to proceed with the experiment.<br>`);
        document.onkeyup = handleKeyReleased;
        keyfunc = ()=>{select('#endDiv').hide(); currentTrainBlock++; clearInterval(timer);sessionComplete++; trainBlockStart();};
        beep();
    } else {
        if(graceTime+timerCount==60) {
            select('#endInstr').html(`<br><br><br><span style="color:red;">Are you still there? Please press Space Bar now or the experiment will terminate.</span>`); // show timer : <br><span style="color:red;">${Math.floor((graceTime+timerCount)/60)} : ${String((graceTime+timerCount)%60).padStart(2,'0')}</span>
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
function beep() {
    var snd = new  Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}
function handleMouseMove(e) {
    if(movin>0) {
        if(delay<0) {
            var scaledMovementX = e.movementX/speed_scale/2;
            var scaledMovementY = e.movementY/speed_scale;
            dotA += scaledMovementX;
            dotB += scaledMovementY;
        }
    } else {
        dotX = fixBetween(dotX+e.movementX/speed_scale/2,-maxX,maxX);
        dotY = fixBetween(dotY+e.movementY/speed_scale,-maxY-sMargin,sMargin);
    }
}
function handleKeyReleased(e) {
    if(e.key===' ' || e.key==='Spacebar') {
        document.onkeyup = null;
        let prev_func = keyfunc;
        keyfunc();
        if(prev_func === keyfunc)
            keyfunc = null;
    }
}
function handleCalibrationKey(e) { // handles key pressed during calibration
    if(e.key===' ' || e.key==='Spacebar') {
        if(mode == 2) {
            mode = 3;
            document.getElementById("container-exp").onmousemove = calibrateMouse;
        } else if(mode == 3) {
            if(dotB < 0.1) { // little mouse movement detected, recalibrate.
                mode = 2;
                dotB = 0;
                return;
            }
            speed_scale = dotB/400;
            console.log(speed_scale);
            document.getElementById("container-exp").onmousemove = handleMouseMove;
            document.onkeyup = null;
            mode = -1;
            dotB = 0;
            dotY = -300.0;
            movin = -1;
        }
    } else if(e.key==='r' && mode==3) {
        mode = 2;
        dotB = 0;
    }
}
function calibrateMouse(e) {
    var scaledMovementY = e.movementY;
    if(scaledMovementY<0)
        dotB -= scaledMovementY;
}
function moveNoise(mod) {
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
    scores = [];
    sessionTotal = computeSessionTotal();
    score_max = -1;
    score_base = [[],[]];
    fullscreen(true);
    trainBlockStart();
}
// Function that ends the game appropriately after the experiment has been completed
function endGame() {
    select('#container-exp').hide();
    fullscreen(false);
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