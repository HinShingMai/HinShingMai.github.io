let ver = 'rlearn-0_2';
var id = null;
let cnv;
let dpi = -1;
let currentTrainBlock = 0;
let trainBlocks = [0,3,1,4];
/*
-n: n-minutes break
0: familiarization block
1: learning/retention
2: generalization
3: baseline1 (learning c-curve without feedback)
4: baseline2 (generalization c-curve without feedback)
*/
let totalTrainBlocks;
let ampl_sign = 
[[1,1],[1,-1],[-1,1],[-1,-1],
[2,2],[2,-2],[-2,2],[-2,-2],
[1,2],[1,-2],[-1,2],[-1,-2],
[2,1],[2,-1],[-2,1],[-2,-1],
[1,0],[0,1],[2,0],[0,2],
[-1,0],[0,-1],[-2,0],[0,-2]];
let sign_choice;
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
var lines_real;
var lines_show;
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
var scores_unsorted;
var saved_sat;
var dis_temp;
var vDis_temp;
var h;
var maxA;
var maxPoints;
var startTime;
var fps;
var error;
var errors;
var path = null;
var pathWidth = 15;
var sessionsType;
var sessionComplete;
var sessionTotal;
var blanknum;
var blank;
var highscore;
var timer;
var timerCount;
var movin;
var delay;
var frBuffer;
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
var dpi_scaling = 0;
var page = 0;
var ding = [new Audio('./ding-1-c.mp3'), new Audio('./ding-13-c.mp3'), null, new Audio('./ding-25-c.mp3')];
const trialInstr = ["","Move the dot into the box at the bottom of the screen. Then, \n\nFollow the path on screen!","Try to follow the path on screen!\n\nOne of them will later be chosen to be the correct path.",
"Try to maximize your score by following the correct path!","Try to follow the movement that\n gave you the highest score!"];
function setup() {
    ding[2] = ding[1];
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
        lines_real = null;
        lines_show = null;
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
    document.getElementById("container-exp").requestPointerLock({unadjustedMovement: true});
    dis = []; 
    vDis = [];
    nse = [];
    scores = [];
    dis_temp = [];
    vDis_temp = [];
    maxPoints = 0;
    maxPoints = 300;
    maxX = width_x*0.625; //150
    maxY = maxX*2;
    wHeight = maxY+2*sMargin;
    scaling = scaling_base;
    dotX = 0;
    dotY = -maxY/2;
    if(sessionsType[currentSession] == 0) { // familiarization session
        if(currentTrainBlock==0) {
            document.onkeyup = handleCalibrationKey;
            mode = 2; // 0: normal, 1: familiarization, 2/3: mouse calibration, 4: no-feedback straight, 5: no-feedback trial, 6: baseline trial
            modes = Array(5).fill(1).concat(Array(5).fill(4)); // 
            movin = -300; // 1: in trial, 0: awaiting cursor to move back to starting position(resetting), <0: inter-trial cooldown
            dis_instr = 1;
            blank = Array(modes.length).fill(-1);
        } else {
            document.getElementById("container-exp").onmousemove = handleMouseMove;
            mode = -1;
            modes = Array(10).fill(4);
            movin = -300;
            dis_instr = 1;
            blank = Array(modes.length).fill(-1);
        }
        [lines_real, lines_show] = straightLine(maxPoints);
        //lines = sinuousCurve(maxPoints, 1);
    } else {
        document.getElementById("container-exp").onmousemove = handleMouseMove;
        mode = -1;
        let reflect = sessionsType[currentSession]; // 1 or 2 = false or true, whether to reflect the C curve
        if(sessionsType[currentSession] > 2) { // baseline or retention block
            reflect = 1;
            if(sessionsType[currentSession] == 3) { // baseline
                dis_instr = 2;
                blank = Array.from(ampl_sign.keys()).sort(() => Math.random()-0.5);
                modes = Array(blank.length).fill(6);
            } else if(sessionsType[currentSession] == 4) { // retention
                modes = Array(10).fill(5);
                dis_instr = 4;
                blank = Array(modes.length).fill(sign_choice);
            }
        } else {
            modes = Array(20).fill(0);
            dis_instr = 3;
            blank = Array(modes.length).fill(sign_choice);
            /*if(currentSession > trainBlocks.length-3) // retention or generalization
                modes = Array(40).fill(0);
            else
                modes = pesudoRandom(4, 10, 1, 0, 6, true);*/
        }
        //modes = Array(40).fill(0);
        movin = -300;
        [lines_real, lines_show] = sinuousCurve(maxPoints, blank);
        if(sessionsType[currentSession] == 3) // true path is shown path in baseline
            lines_real = lines_show;
    }
    clear();
    blanknum = 0;
    frameNum = 0;
    error = [];
    errors = [];
    fps = [0.0,0];
    frBuffer = 60.0;
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
    if(lines_real==null) {
        mse = -1.0;
        plot.hide();
    } else { // handles data
        mse = 0;
        isPlot = false;
        mse = 1.0*mse/errors.length;
        // Record data
        /*if(dis.length > 0)
            recordTrialSession();
        //subject.progress++;
        //lines = null;
        if(sessionComplete<2&&avgfps<50) { // Screen out participants
            forceQuit(1);
        }*/
    }
    mse = mse.toFixed(1);
    select('#container-exp').hide()
    if(currentSession < sessions) { // proceed to next session
        let button = document.getElementById("startBt");
        timer = setTimeout(()=>{select('#endInstr-span').html("Are you still there? Please press space to proceed now or the experiment will terminate.");document.getElementById("endInstr-span").style.color = "red";
                                timer = setTimeout(()=>{forceQuit(2);},60000);},60000);
        testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
        let color = "blue";
        let desc;
        if(sessionsType[currentSession] == 0) {
            desc = "First, lets familiarize ourselves with the experiment."
        }
        else if(sessionsType[currentSession] == 1)
            desc = "Learning: Try to figure out how to get a good score!";
        else if(sessionsType[currentSession] == 4)
            desc = "Retention: Try to follow the movement that gave you the highest score!";
        else
            desc = "Baseline: Now lets try following a curve!";
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
                var inPath = true;
                var pathError = distToPath();
                //inPath = pathError < pathWidth**2;
                error.push(pathError);
                if(-dotY+30*cos(heading)/scaling >= maxPoints) {
                    dis_temp.push(dotX+30*sin(heading)/scaling); // save tip of triangle as final coordinate
                    vDis_temp.push(-dotY+30*cos(heading)/scaling);
                    dis.push(dis_temp);
                    vDis.push(vDis_temp);
                    errors.push(error);
                    if(mode == 0) {
                        //let mean_speed = SAT1_score[0]/SAT1_score[2]; // SAT_score = [sum of speed, sum of error, n]
                        let mean_error = SAT1_score[1]/SAT1_score[2];
                        movin = -120;
                        let score = 200/(mean_error+200);
                        scores.push(score);
                        score_base.push(score);
                        score_max = fixBetween(score*100, 0, 100).toFixed(0);
                        feedback_sc = fixBetween(Math.floor((score-0.05)/0.15), 0, 5);
                        if(score_base.length<5) { // compute current score relative to last 20 trials after 5 trials
                            feedback_rk = -1;
                            ding[1].play();
                        } else {
                            let startpos = Math.max(0, score_base.length-20);
                            let meanStd = getMeanStd(score_base.slice(startpos, score_base.length)); // [mean, std]
                            feedback_rk = fixBetween(Math.floor((score-meanStd[0])/meanStd[1]/0.66)+2, 0, 3);
                            ding[feedback_rk].play();
                        }
                    } else {
                        //let mean_speed = SAT1_score[0]/SAT1_score[2];
                        let mean_error = SAT1_score[1]/SAT1_score[2];
                        movin = -60;
                        let score = 200/(mean_error+200);
                        scores.push(score);
                        ding[1].play();
                    }
                    blanknum++;
                    if(blanknum >= blank.length || blanknum%10 == 0)
                        recordTrialSession();
                    dotA = 0.0;
                    dotB = 0.0;
                    error = [];
                    frameNum = 0;
                    return;
                }
                // motion model
                dotA = fixBetween(dotA,-100,100);
                dotX += dotA;
                if(dotX < -maxX) { // hits edge
                    dotX = -maxX;
                    dotA = 0;
                } else if(dotX > maxX) {
                    dotX = maxX;
                    dotA = 0;
                }
                dotB = fixBetween(dotB,-100,0);
                dotY += dotB;
                if(dotA != 0 || dotB != 0)
                    heading = 0.8*heading + 0.2*fixBetween(Math.atan2(dotA, -dotB),-PI/2,PI/2);
                //update SAT feedback
                //let v = Math.sqrt(dotA**2+dotB**2);
                if(mode < 2 || mode > 3) {
                    //SAT1_score[0] += v*dotB;
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
            //rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);
            /*if(mode == 0 || mode > 3) { // nofeedback trials
                if(delay == -1) {
                    rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);//
                    drawGoal();
                    drawCurve(lines_show);
                } else {
                    drawInstr();
                    drawCurve(lines_show);
                }
                
            } else {
                if(delay == -1) {
                    rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);//
                    drawGoal();
                    drawCurve(lines_show);
                } else
                    drawInstr();
                drawCurve(lines_show);//
                drawTrace(inPath);
            }*/
            rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);
            if(delay == -1) { // in trial
                drawGoal();
            } else { // pretrial
                drawInstr();
            }
            if(mode != 0 && mode != 5)
                drawCurve(lines_show[blanknum]);
            if(mode == 1)
                drawTrace(inPath);
            drawCursor(inPath);
            // save framerate
            fr = frameRate();
            dotA = 0;
            dotB = 0;
            //dotB = -1.25; // constant v speed
            fps[0] += fr;
            fps[1]++;
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
            if(movin<-1)
                movin += 1;
            else if(movin<0) {
                movin += 1;
                if(blanknum >= blank.length) {
                    isDraw = false;
                    sessionNext();
                    return;
                }
                dotY = -40;
                dotX = 0;
            } else if(movin==0) {
                if(delay > 0)
                    delay -= 1;
                else if(delay==0) {
                    if(blanknum < blank.length) {
                        dotX = lines_real[blanknum][0];
                        dotY = 0.0;
                        dis_temp = [];
                        vDis_temp = [];
                        SAT1_score = [0.0,0.0,0];
                        //SAT2_score = [0.0,0.0,0];
                        frameNum = 0;
                        movin = 1;
                        let next_mode = modes[blanknum];
                        /*if(next_mode==4 && mode!=4) {
                            dis_instr = 2;
                            delay = 240;
                        } else if(mode==-1) {
                            if(next_mode==1) {
                                dis_instr = 3;
                                delay = 180;
                            } else {
                                dis_instr = 1;
                                delay = 180;
                            }
                        } else {
                            dis_instr = 0;
                            delay = 60;
                        }*/
                        dis_instr = -1;
                        delay = 60;
                        mode = next_mode;
                    } else {
                        isDraw = false;
                        sessionNext();
                        return;
                    }
                } else {
                    let x = dotX; // start position?
                    let y = dotY;
                    if(x>-30 && x<30 && y>0 && y<20) 
                        delay = 0; // 30
                }
            }
        }
        stroke('gray');
        fill('gray');
        textSize(12);
        strokeWeight(1);
        text(`${currentTrainBlock} - ${blanknum}/${blank.length}`, maxX*scaling-50, sMargin*scaling-10);//sMargin*scaling+10
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
    if(endFix > lines_real[blanknum].length)
        endFix = lines_real[blanknum].length;
    for(let i = startFix+1; i<endFix; i++) {
        let dist = distToSegmentSquared({x: dotX, y: -dotY}, {x: lines_real[blanknum][i-1], y: (i-1)}, {x: lines_real[blanknum][i], y:i});
        if(dist < minDist)
            minDist = dist;
    }
    return minDist;
}
function linearError() { // horizontal distance to trajectory
    if(lines_real==null || dotY>0 || -dotY>=lines_real[blanknum].length+1)
        return 0;
    return (dotX-lines_real[blanknum][Math.floor(-dotY)])**2;
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
function sinuousCurve(len, c) { // len: total length of trajectory, c: constant multiples in front of each gaussian curve
    const wid = 1/1024;
    const amp = width_x/4;
    var X, X2;
    var repeat = c.length;
    var paths = [];
    //var paths2 = [];
    var first_mean = Math.floor(len/4);     // center of each gaussian curve
    var second_mean = Math.floor(3*len/4);
    for(let k=0; k<repeat; k++) { // generate each sub-trajectory
        let points = [];
        //let points2 = [];
        let sig = ampl_sign[c[k]];
        let amp_s = [amp*sig[0], amp*sig[1]];
        let wid_s = [];
        wid_s.push(sig[0]==0? 0: wid/Math.abs(sig[0]));
        wid_s.push(sig[1]==0? 0: wid/Math.abs(sig[1]));
        for(let i=0; i<len; i++) {
            points.push(amp_s[0]*Math.E**(-wid_s[0]*(i-first_mean)**2)+amp_s[1]*Math.E**(-wid_s[1]*(i-second_mean)**2)); // sum of two gaussian curves
        }
        paths.push(points);
    }
    return [paths, paths];
}
function straightLine(len) {
    var mid = 0;
    var path = Array(len).fill(mid);
    lLine = Array(len).fill({x: mid-pathWidth, y: 0});
    rLine = Array(len).fill({x: mid+pathWidth, y: 0});
    paths = Array(blank.length).fill(path);
    lLines = Array(blank.length).fill(lLine);
    rLines = Array(blank.length).fill(rLine);
    return [paths, paths];
}
function arrayRotate(arr, count) { // rotates array, ex. arrayRotate([0, 1, 2, 3, 4, 5], 2) -> [2, 3, 4, 5, 0, 1]
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
/*function pesudoRandom1(num, len, perLen, defaul, special, noFirst) {
    // creates [num] [len]-length arrays with [perLen] number of [special] elements per [len] number of elements. The rest are [defaul].
    // noFirst: Do not put no-feedback at first trial
    var flag = noFirst;
    var arr = [];
    for(let i=0;i<num;i++) {
        let arr_8 = Array(len).fill(defaul);
        let idx_8 = Array.from(Array(len+1).keys());
        if(flag)
            idx_8.shift();
        let choice = Math.floor(Math.random() * idx_8.length);
        arr_8.splice(idx_8[choice], 0, special);
        arr = arr.concat(arr_8);
        if(arr_8[arr_8.length-1] == special)
            flag = true;
        else
            flag = false;
    }
    return arr;
}*/
function pesudoRandom(num, len, perLen, defaul, special, noFirst) {
    // creates [num] [len]-length arrays with [perLen] number of [special] elements per [len] number of elements. The rest are [defaul].
    // noFirst: Do not put no-feedback at first trial
    var flag = noFirst;
    var arr = [];
    for(let i=0;i<num;i++) {
        let arr_10 = Array(len-perLen).fill(defaul);
        let idx_10 = Array.from(Array(len-perLen+1).keys());
        if(flag)
            idx_10.shift();
        for(let j=0;j<perLen;j++) { // pick random index to insert 1 non-feedback before the index
            let choice = Math.floor(Math.random() * idx_10.length);
            //console.log(j+" -> "+choice);
            arr_10.splice(idx_10[choice], 0, special);
            for(let k=choice;k<idx_10.length;k++)
                idx_10[k]++;
            idx_10.splice(choice, 1); // prevents adjacent non-feedback trials
        }
        arr = arr.concat(arr_10);
        if(arr_10[arr_10.length-1] == special)
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
        //stroke('blue');
        //line(maxX*scaling,0,maxX*scaling,dotY*scaling);
        //line(-maxX*scaling,0,-maxX*scaling,dotY*scaling);
    } else {
        fill('blue');
        stroke('blue');
        rect(-maxX*scaling, -(maxY+sMargin)*scaling, 2*maxX*scaling, sMargin*scaling); // draw goal area
        //line(maxX*scaling,0,maxX*scaling,-maxY*scaling);
        //line(-maxX*scaling,0,-maxX*scaling,-maxY*scaling);
    }
}
function drawInstr() {
    stroke('blue');
    fill('blue');
    rect(lines_real[blanknum][0]-30*scaling, 0, 60*scaling, 20*scaling);
    fill('white');
    stroke('white');
    textSize(Math.floor(10*scaling));
    strokeWeight(1);
    textAlign(CENTER);
    if(delay < 30) {
        text("Start", 0, 10*scaling);
    } else {
        /*if(dis_instr == 1) {
            text("Try to figure out how to get a good score!", 0, -maxY*2/3*scaling);
        } else if(dis_instr == 2) {
            text("From now on, you will not see your trajectory.", 0, -maxY*2/3*scaling);
        } else if(dis_instr == 3) {
            text("Follow the white path.", 0, -maxY*2/3*scaling);
        }*/
        if(dis_instr > 0)
            text(trialInstr[dis_instr], 0, -maxY*2/3*scaling);
    }
}
function drawCurve(coords) {
    if(coords!==null) {
        stroke('white');
        strokeWeight(6);
        for(let i = 1; i<coords.length; i++)
            line(coords[i-1]*scaling, (1-i)*scaling, coords[i]*scaling, -i*scaling);
    }
}
/*function drawCursor(state, angle) { // state: true/false = inPath/outOfPath, angle: angle arrow is pointing at (0 is vertical up)
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
    heading = angle;
    let x = dotX*scaling;
    let y = dotY*scaling;
    triangle(x+30*sin(heading), y-30*cos(heading), x+12*cos(heading), y+12*sin(heading), x-12*cos(heading), y-12*sin(heading));
    noFill();
}*/
function drawCursor(state) { // state: true/false = inPath/outOfPath, angle: angle arrow is pointing at (0 is vertical up)
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
    ellipse(dotX*scaling, dotY*scaling, 30, 30);
    noFill();
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
        var coverHeight = maxY+sMargin;
        if(delay<0) {
            stroke('lightgray');
            fill('lightgray');
            //rect(-maxX*scaling, -coverHeight*scaling, maxX*scaling*2, coverHeight*0.6*scaling);
            rect(-30*scaling, 0, 60*scaling, 20*scaling);  // start position?
            ellipse(dotX*scaling, dotY*scaling, 30, 30);
            /*stroke('blue');
            line(maxX*scaling,dotY*scaling,maxX*scaling,0);
            line(-maxX*scaling,dotY*scaling,-maxX*scaling,0);*/
        } else {
            /*stroke('lightgray');
            fill('lightgray');
            rect(-maxX*scaling, -coverHeight*scaling, maxX*scaling*2, coverHeight*0.6*scaling);*/
            stroke('blue');
            fill('blue');
            rect(-30*scaling, 0, 60*scaling, 20*scaling);  // start position?
            ellipse(dotX*scaling, dotY*scaling, 30, 30);
        }
        if(frameNum > 600) {
            stroke('black');
            fill('black');
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
            text(trialInstr[dis_instr], 0, -maxY*2/3*scaling);
            //text(trialInstr[dis_instr], 0, -maxY*2/3*scaling);
        } else {
            rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);//
            drawGoal();
            if(mode != 0 && mode != 5)
                drawCurve(lines_show[blanknum-1]);
            if(mode == 1)
                drawTrace(true);
            if(mode == 0) {
                strokeWeight(1);
                textAlign(CENTER);
                textSize(Math.floor(12*scaling));
                if(feedback_sc>=0) {
                    let colors_list = ["orange","lightgray","lightgray","green"];
                    var choice;
                    if(feedback_rk < 0) choice = 1;
                    else choice = feedback_rk;
                    stroke(colors_list[choice]);
                    fill(colors_list[choice]);
                    //stroke("lightgray");
                    //fill("lightgray");
                    let percentage = score_max;
                    text(`\nYour Score: ${percentage}`, 0, -maxY*scaling*0.7);
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
    graceTime = 180; // participants have 120 seconds to click next button after break timer runs out
    instr.html(`<br>Let's take a ${len} minute break.<br><br>`);
    //instr.html(`<br>Let's take a ${len} minute break.<br><br>${len} : 00`);
    timer = setInterval(breakCountDown, 1000);
}
function breakCountDown() { // timer countdown for break
    timerCount--;
    if(timerCount>10) {
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br><br>${String(Math.floor(timerCount/60)).padStart(2,'0')} : ${String(timerCount%60).padStart(2,'0')}`);
        //select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br>`);
    } else if(timerCount>0) {
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br><br><br><p style="font-size:10vw;color:red;">0 : ${String(timerCount%60).padStart(2,'0')}</p>`);
    } else if(timerCount == 0) {
        select('#endInstr').html(`<br><br><br>Press Space Bar to proceed with the experiment.<br>`);
        document.onkeyup = handleKeyReleased;
        keyfunc = ()=>{select('#endDiv').hide(); currentTrainBlock++; clearInterval(timer);sessionComplete++; trainBlockStart();};
        beep();
    } else {
        if(graceTime+timerCount==120) {
            select('#endInstr').html(`<br><br><br><span style="color:red;">Are you still there? Please press Space Bar in two minutes or the experiment will terminate.</span>`); // show timer : <br><span style="color:red;">${Math.floor((graceTime+timerCount)/60)} : ${String((graceTime+timerCount)%60).padStart(2,'0')}</span>
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
function recordTrialSession() {
    let section = [blanknum-dis.length, blanknum];
    let session = {
        xh: lines_real.slice(section[0], section[1]),
        //xs: lines_show,
        x: Object.assign({}, dis),
        y: Object.assign({}, vDis),
        sec: section,
        num: sessionComplete,
        type: sessionsType[0],
        len: blank,
        id: null, // id
        fps: fps[0]/fps[1],
        version: ver,
        scale: scaling,
        error: Object.assign({}, errors),
        score: scores,
        //SAT: saved_sat.slice(saved_sat.length-blank, saved_sat.length),
        mode: modes.slice(section[0], section[1])
    }
    dis = [];
    vDis = [];
    errors = [];
    fps = [0.0,0];
    scores = [];
    console.log(session);
}
function handleMouseMove(e) {
    if(movin>0) {
        if(delay<0) {
            var scaledMovementX = e.movementX/speed_scale;
            var scaledMovementY = e.movementY/speed_scale;
            dotA += scaledMovementX;
            dotB += scaledMovementY;
        }
    } else {
        dotX = fixBetween(dotX+e.movementX/speed_scale,-maxX,maxX);
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
            movin = -300; // -1
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
    var values = document.getElementsByName('cover-select');
    sign_choice = Number(values[0].value);
    //id = values[1].value;
    //noSave = Number(values[2].value)!=1;
    
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
    score_base = [];
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