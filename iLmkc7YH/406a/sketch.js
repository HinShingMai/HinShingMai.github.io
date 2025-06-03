const firebaseConfig = {
  apiKey: "AIzaSyARetf_IrYgcWGB8StF5nhit9NaVQbdw88",
  authDomain: "bikesim-f46bc.firebaseapp.com",
  databaseURL: "https://bikesim-f46bc-default-rtdb.firebaseio.com",
  projectId: "bikesim-f46bc",
  storageBucket: "bikesim-f46bc.appspot.com",
  messagingSenderId: "153582709015",
  appId: "1:153582709015:web:3d050296d8a5271043af52",
  measurementId: "G-Q3M0346J9W"
};
let ver = 'rlearn-0_3';
var id = null;
let cnv;
let dpi = -1;
let currentTrainBlock = 0;
let trainBlocks = [0,3,1,-1,1,-10,4];//[0,3,1,4];
/*
-n: n-minutes break
0: familiarization block
1: learning/retention
2: generalization
3: baseline1 (learning c-curve without feedback)
4: baseline2 (generalization c-curve without feedback)
*/
let totalTrainBlocks;
let sign_choice;
let horiSteps = 4;
let weig = [1/horiSteps, 1/horiSteps, 1/horiSteps, 1/horiSteps];
let frameNum = 0; // Number of frames in the current session
var dotX;
var dotY;
//var dotV = [1.0, 1.0];
var dotA;
var dotB;
var maxY = 300;
var maxX = maxY;
var width_x = 240;
var targetSize = 30;
var scaling_base;
var scaling;
var lines;
var random_lines = null;
var crossing;
var nextCrossing;
var currentSession;
var sessions;
var blockType;
var isDraw;
var dis;
var vDis;
var nse;
var fail;
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
var wHeight;
var sMargin = 30;
var mode;
var modes;
var score_max;
var score_base;
var speed_scale;
var dis_instr;
var butfunc;
var keyfunc;
var dpi_scaling = 0;
var page = 0;
var redo;
var ding = [new Audio('./ding-1-c.mp3'), new Audio('./ding-13-c.mp3'), null, new Audio('./ding-25-c.mp3')];
const colors_list = ["orange","lightgray","lightgray","green"];
const trialInstr = ["","Move the dot towards the grey dot at the bottom. Then, \n\nMove through each target marked by hollow circles!","Try to move through each of the target!\n\nDuring training, the targets will be hidden\nand you will have to figure out where they are!",
"Try to maximize your score by finding out where the targets are!","Try to follow the movement that\n gave you the highest score!"];
function setup() {
    ding[2] = ding[1];
    isDraw = false;
    frameRate(60);
    randomSeed(102);
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    // arrange sessions in a block
    /*  0: straight line
        1: learning block
        2: mirrored track*/
    if(blockType<0) {
        lines = null;
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
    if(timer) clearTimeout(timer);
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
    fail = [];
    scores = [];
    crossing = [];
    nextCrossing = 0;
    dis_temp = [];
    vDis_temp = [];
    crossing_temp = [];
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
            // -2/3: mouse calibration, 0: start of block, 1: normal, 2: familiarization, 3: no-feedback straight, 4: no-feedback trial, 5: baseline trial, 6: show target feedback trial
            mode = -2;
            modes = Array(5).fill(2).concat(Array(5).fill(3));
            movin = -300; // 1: in trial, 0: awaiting cursor to move back to starting position(resetting), <0: inter-trial cooldown
            dis_instr = 1;
            blank = Array(modes.length).fill(0);
        } else {
            document.getElementById("container-exp").onmousemove = handleMouseMove;
            mode = 0;
            modes = Array(20).fill(3);
            movin = -300;
            dis_instr = 1;
            blank = Array(modes.length).fill(0);
        }
        lines = straightLine(horiSteps);
        //lines = sinuousCurve(maxPoints, 1);
    } else {
        document.getElementById("container-exp").onmousemove = handleMouseMove;
        mode = 0;
        let reflect = sessionsType[currentSession]; // 1 or 2 = false or true, whether to reflect the C curve
        if(sessionsType[currentSession] > 2) { // baseline or retention block
            reflect = 1;
            if(sessionsType[currentSession] == 3) { // baseline
                dis_instr = 2;
                blank = Array.from([0,1,2,3].flatMap(i => [i,i,i,i,i,i,i,i,i,i])).sort(() => Math.random()-0.5);
                //blank = [0,1,2,3,4,5,6,7];
                modes = Array(blank.length).fill(5);
            } else if(sessionsType[currentSession] == 4) { // retention
                modes = Array(20).fill(4).concat(Array(49).fill(1)).concat(6);//Array(70).fill(5);
                dis_instr = 4;
                blank = Array(modes.length).fill(sign_choice);
            }
        } else {
            modes = Array(75).fill(1);
            dis_instr = 3;
            blank = Array(modes.length).fill(sign_choice);
            /*if(currentSession > trainBlocks.length-3) // retention or generalization
                modes = Array(40).fill(0);
            else
                modes = pesudoRandom(4, 10, 1, 0, 6, true);*/
        }
        //modes = Array(40).fill(0);
        movin = -300;
        if(!random_lines) // generate random targets for the first time
            random_lines = randomLine(horiSteps,8);
        lines = random_lines;
    }
    console.log(lines);
    clear();
    blanknum = -1;
    frameNum = 0;
    error = [];
    errors = [];
    fps = [0.0,0];
    frBuffer = 60.0;
    delay = -180;
    redo = 0;
    setInTrialTimer();
    loop();
}
function setInTrialTimer() {
    if(timer) clearTimeout(timer);
    timerCount = 0;
    timer = setTimeout(()=>{
            timerCount = 20;
            beep();
            timer = setTimeout(()=>{
                document.exitPointerLock();
                cnv.parent().onmousemove = null;
                noLoop();
                butfunc = ()=>{cnv.parent().requestPointerLock({unadjustedMovement: true});
                                cnv.parent().onmousemove = handleMouseMove;
                                frameNum = 0;
                                setInTrialTimer();
                                loop();};
                forceQuit(2);} ,10000);
            } ,20000);
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
            desc = "Learning: You will receive a score based on how close you are to the targets. Try to figure out how to get a good score!";
        else if(sessionsType[currentSession] == 4)
            desc = "Retention: The score will be hidden as well. Try to follow the movement that gave you the highest score!";
        else
            desc = "Baseline: Now lets try some random targets!";
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
                var pathError = crossesLine(lines[blank[blanknum]]);
                //inPath = pathError < pathWidth**2;
                //error.push(pathError);
                if(nextCrossing >= horiSteps) {
                    if(frameNum < 360) {
                        dis.push(dis_temp);
                        vDis.push(vDis_temp);
                        let sc_er = getScoreError(crossing_temp, lines[blank[blanknum]], weig);
                        errors.push(sc_er[1]);
                        let score = sc_er[0];
                        scores.push(score);
                        score_max = fixBetween(score*100, 0, 100).toFixed(0);
                        console.log(sc_er);
                        if(mode == 1 || mode == 6) {
                            movin = -120;
                            score_base.push(score);
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
                            movin = -120; // -60
                            feedback_rk = -1;
                            ding[1].play();
                        }
                        redo = 0;
                        if(blanknum > blank.length-2 || blanknum%10 == 9)
                            recordTrialSession();
                    } else {
                        fail.push({x: dis_temp, y: vDis_temp, cross: crossing_temp, trial: blanknum})
                        movin = -120;
                        redo = 1;
                        ding[0].play();
                    }
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
                if(dotY > maxY+sMargin) {
                    dotY = maxY+sMargin;
                    dotB = 0;
                }
                if(abs(dotA)>1 || abs(dotB)>1)
                    setInTrialTimer();
            } else {
                delay -= 1;
                inPath = true;
                setInTrialTimer();
            }
            // draw
            clear();
            background('black');
            stroke('white');
            strokeWeight(4);
            noFill();
            translate(windowWidth/2, windowHeight*(sMargin+maxY)/wHeight);
            rect(-(maxX+sMargin)*scaling, sMargin*scaling, (maxX+sMargin)*scaling*2, -wHeight*scaling);
            if(mode == 2 || mode == 3 || mode == 5)
                drawCurve(lines[blank[blanknum]]);
            if(mode == 2)
                drawTrace(inPath);
            drawCursor(inPath);
            if(delay == -1) { // in trial
                drawGoal(lines[blank[blanknum]]);
            } else { // pretrial
                drawInstr();
            }
            // save framerate
            fr = frameRate();
            dotA = 0;
            dotB = 0;
            //dotB = -1.25; // constant v speed
            fps[0] += fr;
            fps[1]++;
            frameNum++;
        } else {
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
            dotB = fixBetween(dotB,-100,100);
            dotY += dotB;
            if(-dotY > maxY+sMargin) {
                dotY = -maxY-sMargin;
                dotB = 0;
            } else if(dotY > sMargin) {
                dotY = sMargin;
                dotA = 0;
            }
            if(movin<0||abs(dotA)>1 || abs(dotB)>1)
                setInTrialTimer();
            dotA = 0;
            dotB = 0;
            // draw reset trials after each learning trial
            clear();
            background('black');
            stroke('white');
            strokeWeight(4);
            noFill();
            translate(windowWidth/2, windowHeight*(sMargin+maxY)/wHeight);
            rect(-(maxX+sMargin)*scaling, sMargin*scaling, (maxX+sMargin)*scaling*2, -wHeight*scaling);
            drawReturnCursor();
            frameNum++;
            if(movin<-1) {
                if(mode >= 0)
                    movin += 1;
            } else if(movin<0) {
                movin += 1;
                if(redo == 0) {
                    blanknum++;
                    if(blanknum >= blank.length) {
                        isDraw = false;
                        sessionNext();
                        return;
                    }
                }
                dotY = -40;
                dotX = 0;
            } else if(movin==0) {
                if(delay > 0)
                    delay -= 1;
                else if(delay==0) {
                    dotX = 0.0;
                    dotY = 0.0;
                    nextCrossing = 0;
                    dis_temp = [];
                    vDis_temp = [];
                    crossing_temp = [];
                    frameNum = 0;
                    movin = 1;
                    let next_mode = modes[blanknum];
                    dis_instr = -1;
                    delay = 60;
                    mode = next_mode;
                } else {
                    if(isNear(dotX,dotY,-targetSize,-targetSize,targetSize,targetSize))
                        delay = 0;
                }
            }
        }
        stroke('gray');
        fill('gray');
        strokeWeight(1);
        if(document.pointerLockElement !== cnv.parent()) {
            let txtScale = Math.floor(10*scaling);
            textSize(txtScale);
            text('Click on the screen to lock your cursor', 0, -txtScale);
            if(!cnv.parent().onclick)
                cnv.parent().onclick = handleExpClick;
        }
        textSize(12);
        text(`${currentTrainBlock} - ${Math.max(blanknum, 0)}/${blank.length}`, maxX*scaling-50, sMargin*scaling-10);
        if(timerCount > 10) {
            stroke('red');
            fill('red');
            textSize(Math.floor(12*scaling));
            text("Are you still there?\nMove your cursor now or the experiment\nwill terminate due to inactivity.", 0, -maxY*scaling*0.3);
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
function isNear(pointX,pointY,targetX1,targetY1,targetX2,targetY2) { // check if point is inside target box
    var tx1 = Math.min(targetX1, targetX2);
    var tx2 = Math.max(targetX1, targetX2);
    var ty1 = Math.min(targetY1, targetY2);
    var ty2 = Math.max(targetY1, targetY2);
    if(pointX>tx1 && pointX<tx2 && pointY>ty1 && pointY<ty2)
        return true;
    //console.log(pointX+' '+pointY+' | '+tx1+' '+tx2+' '+ty1+' '+ty2)
    return false;
}
function crossesLine(lines_coor) { // check if cursor crosses one of the lines
    if(dis_temp.length < 2 || vDis_temp[vDis_temp.length-1] < lines_coor[nextCrossing].y)
        return false;
    var x1 = dis_temp[dis_temp.length-2];
    var x2 = dis_temp[dis_temp.length-1];
    var y1 = vDis_temp[vDis_temp.length-2];
    var y2 = vDis_temp[vDis_temp.length-1];
    var l2 = (lines_coor[nextCrossing].y-y1)/(y2-y1);
    var crossX = x1 + (x2-x1)*l2;
    crossing_temp.push(crossX);
    nextCrossing++;
    return true;
}
/*function getScoreError(crossing_p, crossing_t, weight) {  // linear error
    var sumError = 0;
    for(let i=0; i<crossing_p.length; i++)
        sumError += weight[i]*Math.abs(crossing_t[i].x-crossing_p[i]);
    return [Math.max(1 - sumError/maxX/0.8, 0), sumError];
}*/
function getScoreError(crossing_p, crossing_t, weight) { // gaussian error
    var sumError = 0;
    for(let i=0; i<crossing_p.length; i++)
        sumError += weight[i]*exp(-1/2/37.5**2*(crossing_t[i].x-crossing_p[i])**2);
    return [sumError, sumError];
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
function randomLine(steps, num) {
    var YDist = Math.floor(maxPoints/steps);
    targets = [];
    for(let j=0; j<num; j++) {
        target = [];
        for(let i=0; i<steps; i++)
            // target is between +- 0.8 * screen width to prevent them from being too close to edge
            target.push({x: random(-1,1)*maxX*0.8, y:(i+1)*YDist})
        targets.push(target);
    }
    return targets;
}
function straightLine(len) {
    var YDist = Math.floor(maxPoints/len);
    targets = [];
    for(let i=0; i<len; i++)
        targets.push({x: 0, y:(i+1)*YDist})
    return [targets];
}
function arrayRotate(arr, count) { // rotates array, ex. arrayRotate([0, 1, 2, 3, 4, 5], 2) -> [2, 3, 4, 5, 0, 1]
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
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
function drawGoal(coords) {
    //var numCrossing = movin>0? nextCrossing: horiSteps;
    stroke('blue');
    fill('blue');
    push();
    textSize(Math.floor(12*scaling));
    strokeWeight(1);
    textAlign(CENTER);
    text("Start", 0, 0);
    pop();
    for(let i=0;i<nextCrossing;i++)
        line(-maxX*scaling, -coords[i].y*scaling, maxX*scaling, -coords[i].y*scaling);
    fill('white');
    stroke('white');
    for(let i=nextCrossing;i<horiSteps;i++)
        line(-maxX*scaling, -coords[i].y*scaling, maxX*scaling, -coords[i].y*scaling);
}
function drawInstr() {
    fill('white');
    stroke('white');
    textSize(Math.floor(12*scaling));
    strokeWeight(1);
    textAlign(CENTER);
    if(delay < 30) {
        text("Start", 0, 0);
    } else {
        if(dis_instr > 0)
            text(trialInstr[dis_instr], 0, -maxY*2/3*scaling);
    }
}
function drawCurve(coords) {
    if(coords!==null) {
        stroke('white');
        noFill();
        strokeWeight(4);
        for(let i=0;i<horiSteps;i++)
            ellipse(coords[i].x*scaling, -coords[i].y*scaling, 40, 40);
    }
}
function drawCursor(state) { // state: true/false = inPath/outOfPath, angle: angle arrow is pointing at (0 is vertical up)
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
/*function drawTrace(state) { // draw trace behind triangle, state: true/false = inPath/outOfPath
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
}*/
function drawTrace(state) { // draw trace behind triangle, state: true/false = inPath/outOfPath
    /*var baseColor;
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
    stroke(baseColor);*/
    stroke('white');
    if(movin<1)
        strokeWeight(8);
    else
        strokeWeight(4);
    for(var i=0;i<crossing_temp.length;i++)
        line(crossing_temp[i]*scaling,-lines[blank[blanknum]][i].y*scaling-20,crossing_temp[i]*scaling,-lines[blank[blanknum]][i].y*scaling+20);
}
function drawReturnCursor() {
    if(mode == -2) { // during mouse calibration
        stroke('lightgray');
        fill('lightgray');
        textSize(Math.floor(10*scaling));
        strokeWeight(1);
        textAlign(CENTER);
        text(`To measure your touchpad sensitivity, we need you to: \nPress space and move your finger one credit card length rightwards.\nYou can use any card to help you with measurement. \n\nPress space on your keyboard to begin calibration...`, 0, -maxY*2/3*scaling);
        return;
    } else if(mode == -3) {
        stroke('lightgray');
        fill('lightgray');
        textSize(Math.floor(10*scaling));
        strokeWeight(1);
        textAlign(CENTER);
        text(`Move your finger one credit card length (8.5cm) rightwards.\n\nPress space again when you are done moving.\nPress r to go back or restart calibration.`, 0, -maxY*2/3*scaling);
        return;
    }
    if(movin==0) {
        var coverHeight = maxY+sMargin;
        if(delay<0) {
            stroke('lightgray');
            fill('lightgray');
            //rect(-maxX*scaling, -coverHeight*scaling, maxX*scaling*2, coverHeight*0.6*scaling);
            ellipse(0, 0, 30, 30);  // start position?
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
            ellipse(0, 0, 30, 30);  // start position?
            ellipse(dotX*scaling, dotY*scaling, 30, 30);
        }
        if(frameNum > 600) {
            stroke('lightgray');
            fill('lightgray');
            textSize(Math.floor(10*scaling));
            strokeWeight(1);
            textAlign(CENTER,CENTER);
            text("Move the dot into the box at the bottom of the screen.", 0, -maxY*2/3*scaling);
        }
    } else {
        if(dis_instr>-1) {
            stroke('lightgray');
            fill('lightgray');
            strokeWeight(1);
            textAlign(CENTER);
            textSize(Math.floor(10*scaling));
            text(trialInstr[dis_instr], 0, -maxY*2/3*scaling);
            //text(trialInstr[dis_instr], 0, -maxY*2/3*scaling);
        } else {
            //rect(-maxX*scaling, sMargin*scaling, maxX*scaling*2, -wHeight*scaling);
            drawGoal(lines[blank[blanknum]]);
            if(mode != 1 && mode != 4)
                drawCurve(lines[blank[blanknum]]);
            if(mode != 4)//if(mode == 1)
                drawTrace(true);
            if(redo > 0) {
                strokeWeight(1);
                textAlign(CENTER);
                textSize(Math.floor(12*scaling));
                stroke("red");
                fill("red");
                text(`Too Slow\nPlease try again`, 0, -maxY*scaling*2/3);
            } else if(mode != 4) { // mode == 0
                strokeWeight(1);
                textAlign(CENTER);
                textSize(Math.floor(24*scaling));
                var choice;
                if(feedback_rk < 0) choice = 1;
                else choice = feedback_rk;
                stroke(colors_list[choice]);
                fill(colors_list[choice]);
                let percentage = score_max;
                text(`${percentage}`, 0, -maxY*scaling*0.6);
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
    if(timerCount == 60 && timerCount > 120) {
        beep();
    } else if(timerCount>10) {
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
/*function recordTrialSession(session) {
    if (noSave)
        return null;
    let dat_id = 'rlearn/'+ver+'/'+id+'_'+session.day+'_'+session.num+'_'+session.type;
    firebase.database().ref(dat_id).set(session)
        .then(function() {
            return true;
        })
        .catch(function(err) {
            console.error(err);
            throw err;
        });
}*/
function recordTrialSession() {
    let section = [blanknum+1-dis.length, blanknum+1];
    let session = {
        xh: lines.slice(section[0], section[1]),
        //xs: lines,
        x: Object.assign({}, dis),
        y: Object.assign({}, vDis),
        sec: section,
        num: sessionComplete,
        type: sessionsType[0],
        len: blank,
        id: id,//subject.id,
        fps: fps[0]/fps[1],
        version: ver,
        scale: scaling,
        error: Object.assign({}, errors),
        score: scores,
        fails: fail,
        mode: modes.slice(section[0], section[1])
    }
    dis = [];
    vDis = [];
    errors = [];
    fail = [];
    fps = [0.0,0];
    scores = [];
    console.log(session);
    if(!noSave) {
        let dat_id = 'rlearn/'+ver+'/'+id+'_'+session.num+'_'+section[0]+"_"+session.type;
        /*return collection.doc(id).set(session)
            .then(function() {
                return true;
            })
            .catch(function(err) {
                console.error(err);
                throw err;
            });*/
        firebase.database().ref(dat_id).set(session)
            .then(function() {
                return true;
            })
            .catch(function(err) {
                console.error(err);
                throw err;
            });
    }
}
/*function handleMouseMove(e) {
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
}*/
function handleMouseMove(e) {
    if(movin<=0 || delay<0) {
        var scaledMovementX = e.movementX/speed_scale;
        var scaledMovementY = e.movementY/speed_scale;
        dotA += scaledMovementX;
        dotB += scaledMovementY;
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
        if(mode == -2) {
            mode = -3;
            speed_scale = 0
            document.getElementById("container-exp").onmousemove = calibrateMouse;
        } else if(mode == -3) {
            if(speed_scale < 0.1) { // little mouse movement detected, recalibrate.
                mode = -2;
                speed_scale = 0;
                return;
            }
            speed_scale = speed_scale/800;
            console.log(speed_scale);
            document.getElementById("container-exp").onmousemove = handleMouseMove;
            document.onkeyup = null;
            mode = 0;
            dotY = -300.0;
            movin = -300; // -1
        }
    } else if(e.key==='r' && mode==-3) {
        mode = -2;
        speed_scale = 0;
    }
}
function calibrateMouse(e) {
    var scaledMovement = e.movementX;
    if(scaledMovement>0)
        speed_scale += scaledMovement;
}
function handleExpClick(e) {
    cnv.parent().requestPointerLock({unadjustedMovement: true});
    cnv.parent().onclick = null;
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
    id = values[1].value;
    noSave = Number(values[2].value)!=1;
    
    if(!noSave) {
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        // Initialize Realtime Database and get a reference to the service
        const database = firebase.database();
        // sign in
        const auth = firebase.auth();
        firebase.auth().signInWithEmailAndPassword('hinshingmai@hotmai.com', '123456789')
          .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log('successfully signed in to firebase');
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(error.code+': '+error.message);
          });
    }
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    let sx = windowWidth/width_x*0.8/(1+sMargin*2/maxX);
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
    let sx = windowWidth/width_x*0.8/(1+sMargin*2/maxX);
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