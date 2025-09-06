// Import the functions you need from the SDKs you need
//import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
//import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
// Initialize Realtime Database and get a reference to the service
const database = firebase.database();
// Function used to upload reach data in the database
function recordTrialSession(session) {
    if (noSave)
        return null;
    let dat_id = 'denovo/'+ver+'/'+id+'_'+session.day+'_'+session.num+'_'+session.type;
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

var noSave = true;
let ver = 'denovo-0_54';
var id;
var exDay;
var timestamp;
let cnv;
var cnv_hei;
var cnv_wid;
var mode = 0;
let currentTrainBlock = 0;
let trainBlocks = [6,5,-1,5,-1,5,6];
/*
-n: n-minutes break
0: no path normal familiarization block
4: normal training block
5: reverse training block
6: normal testing block
7: reverse testing block
*/
let totalTrainBlocks;
let amplitudes = [[6.93*10,4.03*0.73/2.27*1.30*1.30*7.5, 4.03*0.73/2.27*0.97*0.97*7.5], [6.93*15,3.42*0.73/1.84*1.03*1.03*11.25, 3.42*0.73/1.84*0.81*0.81*11.25]];
let frequency = [[0.1/21.48,1.15/21.48, 1.55/21.48], [0.15/21.48,1.45/21.48, 1.85/21.48]];
let b_val = [[1,1],[-1,-1]]; // whether to reflect x/y axis at normal and reverse
let b_desc = ['Normal','Reverse'];
let b_col = ['blue','red'];
let timestep = 0; // current timestep, 1/60 seconds at 60 fps
var gameLoop;
var gameLoopTime = null;
var dotX;
var dotY;
var dotA;
var dotB;
var maxX;
var maxY;
var width_x = 240;
var scaling_base;
var scaling;
var lines;
var currentSession;
var sessions;
var offset;
var blockType;
var isDraw;
var dis;
var act;
var tim;
var rew;
var isTest;
var maxPoints;
var fps;
var error;
var errors;
var prev_error;
var reward;
var maxReward = 3;
var rewardStep = 15;
var scoreBuffer;
var trace;
var traceBuffer;
var traceLen = 10;
var inactivity1; // in trial inactivit timer
var inactivity2; // press button inactivity timer
var sessionsType;
var sessionComplete;
var sessionTotal;
var blanknum;
var blank;
var pOffsets;
var highscore;
var firstTrial = [true, true];
var timer;
var timerCount;
var movin;
var frBuffer;
var fbMsg;
var trialMsg;
var topMsg;
var midMsg;
var scBuffer;
var freeze;
var freeze2;
var dotU = [0,0];
var maxV = [5,5];
const tgtSpeed = 1.75;
var maxTailLen = 120;
var tailLen;
var trialFreeze;
var touchFreezeLen = 180;
var touchCalibrLen = 600;
var wakeLock;
var touchState = [false, false, false];
var touchSize = 80;
var touchesList = [];
var blockDesc = ['FPS Test','Reverse Test','Normal Path Length Test','Reverse Path Length Test','Normal Stay-In-the-Circle Test','Reverse Stay-In-the-Circle Test','Normal Train','Reverse Train','Normal Train','Reverse Train'];
var trialSoundSrc = ['./static/coin3.mp3', './static/coin3.mp3', './static/coin3.mp3'];
var trialAudioObj;
var trialSoundState;
var soundTestState = 0;
var bubbleSize = 75;
var bubbleGrace = 60
function setup() {
    isDraw = false;
    frameRate(60);
    randomSeed(1024);
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    // arrange sessions in a block
    /*  Blocks:
        0: fps test
        1: Day 2+ retention test
        2: normal predict test
        3: reverse predict test
        4: normal testing session
        5: reverse testing session
        6: normal training session short
        7: reverse training session short
        8: normal training session long
        9: reverse training session long
        
        Sessions:
        2: normal predict test
        3: reverse predict test
        4: normal bubble test
        5: reverse bubble test
        6: normal training session short
        7: reverse training session short
        8: normal training session long
        9: reverse training session long
    */
    if(blockType<0) {
        startBreak(-blockType);
        return;
    } else {
        sessionsType = [blockType];
    }
    sessions = sessionsType.length;
    currentSession = 0;
    if(currentTrainBlock == 0)
        sessionInfo();
    else
        startSession();
}
function getSessionLen(session) {
    var sLen = [0,3,10,10,5,5,5,5,15,15];
    return sLen[session];
}
function sessionNext() {
    pauseDraw();
    currentSession++;
    sessionInfo();
}
function startSession() {
    isDraw = true;
    select('#container-exp').show()
    dis = []; 
    act = [];
    tim = [];
    rew = [];
    isTest = Math.floor(sessionsType[currentSession]/2); // 1: horizon test, 2: bubble test, 3: train, 0: Other
    offsets = sessionsType[currentSession]%2;
    blanknum = 0;
    maxY = width_x*0.75;
    maxX = width_x/2;
    scaling = scaling_base;
    maxPoints = 1800;
    trialFreeze = 300;
    if(isTest==0) {
        if(sessionsType[currentSession] == 0) {
            maxPoints = 600;
            blank = [1];
            trialFreeze = 120; // trial starts faster
        } else if(sessionsType[currentSession] == 1) {
            offsets = [1,0,1]
            blank = [1,1,1];
        }
    } else if(isTest==1) { // 10 minutes predict test
        if(isFirstHorizon) {
            blank = [1].concat([0,0.1,0.2,0.3,0.4,0.5,0.75]);
            isFirstHorizon = false;
        } else
            blank = [1].concat([0,0.1,0.2,0.3,0.4,0.5,0.75].reverse());
        //blank = [1].concat(shuffle([0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8]));
    } else if(isTest==2) { // bubble test
        maxPoints = 600;
        blank = Array(5).fill(1); // 5 sub-sessions
        trialFreeze = 120; // trial starts faster
    } else { // Train
        if(sessionsType[currentSession]<8)
            blank = Array(5).fill(1); // 5 sub-sessions
        else
            blank = Array(15).fill(1); // 15 sub-sessions
        //blank = [1,1,1];
    }
    lines = sinuousCurve(maxPoints, isTest);
    errors = [];
    movin = true;
    fps = [0.0, 0];
    frBuffer = 60.0;
    if(isTest == 2) topMsg = 'Stay near the target for 10 seconds!';
    else topMsg = '';
    scBuffer = '';
    startTrial();
    if(sessionsType[currentSession] > 0) {
        midMsg = '';
        //fbMsg = 'Progress: '+int(sessionComplete/sessionTotal*100)+'%';
        if(mode == 0) {
            fbMsg = getProgressMsg();
            trialMsg = b_desc[offset];
        } else { // first trial calibration
            fbMsg = '';
            trialMsg = '';
        }
        touchesList = [];
        runDraw();
    } else {
        trialMsg = '';
        fbMsg = '';
        midMsg = 'Please wait while the \ngraphics test is underway...';
        clear();
        touchesList = [{clientX: cnv_wid/2+maxX*scaling, clientY: cnv_hei/2+maxY*scaling},
                        {clientX: cnv_wid/2-maxX*scaling, clientY: cnv_hei/2+maxY*scaling}]
        try {
            //wakeLock = await navigator.wakeLock.request("screen");
            navigator.wakeLock.request("screen").then((x)=>{wakeLock=x});
        } catch (err) {
            // The Wake Lock request has failed - usually system related, such as battery.
            console.log(`${err.name}, ${err.message}`);
        }
        //if(gameLoop) clearInterval(gameLoop)
        //gameLoop = setInterval(stepTime, 1000/60);
        if(gameLoop) clearTimeout(gameLoop);
        gameLoopTime = null;
        gameLoop = requestAnimationFrame(stepTime);
        loop();
    }
}
function sessionInfo() {
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    let plot = select('#plot');
    //var mse;
    htmlDiv.show();
    if(lines!=null && currentSession > 0) { // handles data
        //mse = stepScore();
        let avgfps = fps[0]/fps[1];
        /*if(isTest) {
            let msg;
            let color = offset==0? "blue":"red";
            if(highscore[offset]<0) {
                highscore[offset] = mse;
                //msg = `<br><br>Best performance error: ${highscore[offset].toFixed()}`;
                msg = `<br><br>Best performance score: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            } 
            else if(mse>highscore[offset]) {
                highscore[offset] = mse;
                //msg = `<br><br>Congratulations! Your score improved better! Keep it up!<br><br>Best performance error: ${highscore[offset].toFixed()}`;
                msg = `<br><br>Congratulations! Your score improved!<br><br>Best performance score: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            } else {
                //msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance error: ${highscore[offset].toFixed()}`;
                msg = `<br><br>Try to beat your best score!<br><br>Best performance score: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            }
            plot.show();
            plot.html(msg);
        }*/
    } else {
        //mse = -1.0;
        plot.hide();
    }
    //mse = mse.toFixed();
    select('#container-exp').hide()
    let button1 = document.getElementById("startBt");
    timer = setTimeout(()=>{select('#endInstr-span').html("Are you still there? Please click the button now or the experiment will terminate.");document.getElementById("endInstr-span").style.color = "red";
                            timer = setTimeout(()=>{forceQuit(2);},60000);},60000);
    select('#endInstr').style.fontSize = "min(4vh, 8vw)";
    if(currentSession == 0) {
        let desc = getBlockDesc(sessionsType[currentSession]);
        instr.html(`${desc}<br><br><span id="endInstr-span"> </span>`);
        butfunc = ()=>{plot.hide();select('#endDiv').hide();startSession();};
        /*clearTimeout(timer);
        plot.hide();
        select('#endDiv').hide();
        startSession();*/
    } else if(currentSession < sessions) { // proceed to next session
        let prev_offset = sessionsType[currentSession-1]%2;
        let desc = getBlockDesc(sessionsType[currentSession]);
        if(firstTrial[prev_offset])
            firstTrial[prev_offset] = false;
        instr.html(`${desc}<br><br>${topMsg}<br><span id="endInstr-span"> </span>`);
        butfunc = ()=>{plot.hide();select('#endDiv').hide();startSession();};
    } else { // end of a block
        if(currentTrainBlock+1 < totalTrainBlocks){ // proceed to next block
            let desc = getBlockDesc(trainBlocks[currentTrainBlock+1]);
            instr.html(`${desc}<br><br>${topMsg}<br><span id="endInstr-span"> </span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else { // Final block, end game
            instr.html(`<br><br><br>${topMsg}<br><span id="endInstr-span"> </span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; endGame();};
        }
    }
    button1.onclick = ()=>{clearTimeout(timer);butfunc();};
}
function getBlockDesc(block) {
    if(block < 0) {
        return '';
    } else if(block < 2) {
        return `Now we start ${getSessionLen(block)} sessions of<br><br><span>${blockDesc[block]}</span>`;
    } else {
        let color = b_col[block%2];
        return `Now we start ${getSessionLen(block)} sessions of<br><br><span style="color:${color};">${blockDesc[block]}</span>`;
    }
}
function stepTime(timestamp) {
    var deltaT;
    if(!gameLoopTime)
        gameLoopTime = timestamp;
    deltaT = constrain((timestamp - gameLoopTime)*0.06, 0.1, 15);
    gameLoopTime = timestamp;
    //console.log(deltaT)
    var TrialEndCode;
    if(timestep >= maxPoints+trialFreeze)
        TrialEndCode = 1; // trial complete
    //else if(isTest==2 && Math.sqrt(prev_error)>bubbleSize)
    else if(isTest==2 && reward < -bubbleGrace)
        TrialEndCode = 2; // trial fail
    else
        TrialEndCode = 0; // continue trial
    if(TrialEndCode>0) {
        if(mode == 4) { // do not save data if the session is fps test
            isDraw = false;
            endFPSTest();
            return;
        }
        if(isTest==2 && TrialEndCode == 1) { // play success sound for bubble test complete
            if(trialAudioObj.paused) trialAudioObj.play();
            else trialAudioObj.currentTime = 0
        }
        // record final trajectories
        let mean_err = trimmedAverage(error, 0.01);// error/timestep;
        //dis_temp.push({x: dotX, y: dotY});
        //act_temp.push({x: dotU[0], y: dotU[1]});
        dis.push(dis_temp);
        act.push(act_temp);
        tim.push(tim_temp);
        rew.push(rew_temp);
        errors.push(mean_err);
        //let score = errorToScore(mean_err);
        let score = stepScore();
        let trialData = { // save data
            xh: lines[blanknum],
            x: dis_temp,
            u: act_temp,
            t: tim_temp,
            r: rew_temp,
            BlockNo: currentTrainBlock,
            TrialNo: blanknum,
            BlockType: sessionsType[currentSession],
            horizon: blank[blanknum],
            offset: Object.assign({}, pOffsets[blanknum]),
            TrajErr: error,
            err: mean_err,
            score: score,
            id: id,
            fps: fps[0]/fps[1],
            time: new Date().toISOString(),
            day: exDay,
            version: ver,
            scale: scaling
        }
        console.log(trialData)
        //recordTrial(trialcollection, trialData);
        sessionComplete++;
        console.log('Trial Completed:'+sessionComplete);
        if(isTest == 2) {
            if(TrialEndCode == 2) topMsg = 'Fail: lasted '+(scoreBuffer[1]/60).toFixed(2)+'s';
            else topMsg = 'Success!';
        } else topMsg = 'Previous Trial Score: '+score.toFixed()+'%'; // show score
        if(blanknum < blank.length-1) { // next trial
            blanknum++;
            fbMsg = getProgressMsg();
            startTrial();
            if(offsets.constructor === Array) // show next trial type if normal/reverse changes in block
                trialMsg = b_desc[offset];
        } else { // end of session
            isDraw = false;
            sessionNext();
            return;
        }
    }
    touchState = [false, false, false];
    for(let i=0; i<touchesList.length; i++) {
        let x = touchesList[i].clientX-cnv_wid/2;
        let y = touchesList[i].clientY-cnv_hei/2-maxY*scaling;
        //console.log(""+x+"  "+y);
        if(Math.abs(y) < touchSize) {
            if(!touchState[0] && Math.abs(x+maxX*scaling) < touchSize*1.5)
                touchState[0] = true;
            if(!touchState[1] && Math.abs(x-maxX*scaling) < touchSize*1.5)
                touchState[1] = true;
        }
    }
    if(noSave || (touchState[0] && touchState[1])) {
        touchState[2] = true;
        if(freeze2 > 0) {
            freeze2 -= deltaT;
            if(freeze2 <= 0) {
                freeze2 = 0;
                if(mode != 4) {
                    midMsg = '';
                    if(mode == 3) { // end first trial calibration
                        mode = 0;
                        fbMsg = getProgressMsg();
                        trialMsg = b_desc[offset];
                        dotX = lines[blanknum][0].x; // reset ball to starting position
                        dotY = lines[blanknum][0].y;
                    }
                }
            } else
                if(mode==3) {
                    midMsg = 'Tilt your phone around to move the ball\n\nRelease the buttons if you need more time \nto find a comfortable grip\n\n'+
                            'Keep buttons pressed to resume: \n'+Math.ceil(freeze2/60);
                    // moves ball during calibration
                    dotX = dotX + deltaT*b_val[offset][0]*constrain(dotU[0]/30,-1,1)*maxV[0];
                    dotX = constrain(dotX, -maxX, maxX);
                    dotY = dotY - deltaT*b_val[offset][1]*constrain(dotU[1]/30,-1,1)*maxV[1];
                    dotY = constrain(dotY, -maxY, maxY);
                } else if(mode==0) midMsg = 'Keep buttons pressed to resume: '+Math.ceil(freeze2/60);
        }
    } else { // bottom buttons not pressed
        if(mode==3)
            midMsg = 'Calibration:\n\nPress both buttons at the bottom to begin\n\nThen, find a grip that allows you to \nmove the ball while holding the buttons down\n\n'+
                    'If you need more time, \nrelease the buttons to restart calibration'
        else if(mode==0)
            midMsg = 'Press the buttons on both sides to start!';
        if(mode == 3) // first trial calibration
            freeze2 = touchCalibrLen;
        else if(freeze>0) // before trial start
            freeze2 = 1;
        else // in trial
            freeze2 = touchFreezeLen;
    }
    if(freeze2<=0) { // bottom buttons pressed
        if(freeze<=0) { // in trial
            // record trajectory
            dis_temp.push({x: dotX, y: dotY});
            act_temp.push({x: dotU[0], y: dotU[1]});
            tim_temp.push(timestep);
            rew_temp.push(reward);
            if(lines!=null) {
                var pathError = sqError();
                if(act_temp.length > 1 && mode != 4) {
                    if(dist2(act_temp[act_temp.length-1],act_temp[act_temp.length-2]) < maxV[0]*0.01) { // no tilt acceleration
                        if(pathError > prev_error*0.9)
                            inactivity1 += deltaT/2;
                    } else if(inactivity1 > 0) // inactivity decays when active
                        inactivity1 = Math.max(inactivity1-deltaT, 0);
                }
                if(isTest == 2) {
                    if(Math.sqrt(pathError)>bubbleSize)
                        reward--;
                    else
                        reward = 0;
                    //scoreBuffer[0] += reward*deltaT;
                    scoreBuffer[1] += deltaT;
                } else {
                    reward = stepFrameScore(pathError);
                    scoreBuffer[0] += reward*deltaT;
                    scoreBuffer[1] += deltaT;
                    /*if(trialSoundState == 0 && reward > 0 && mode == 0) { // play sound based on reward (play after audio ended)
                        trialSoundState = 1;
                        trialSounds[reward-1].addEventListener('ended', handleTrialSoundEnd, {once: true});
                        trialSounds[reward-1].play();
                    }*/
                    if(mode == 0) {
                        if(trialSoundState <= 0 && reward == maxReward) { // play sound based on reward (static duration)
                            trialSoundState = 60;
                            //trialAudioObj.src = trialSoundSrc[reward-1];
                            if(trialAudioObj.paused) trialAudioObj.play();
                            else trialAudioObj.currentTime = 0
                        } else
                            trialSoundState = Math.max(trialSoundState-deltaT, 0);
                    }
                }
            }
            if(timestep%5 < 1) { // for drawing trace behind ball
                if(traceBuffer != null)
                    trace.push(traceBuffer);
                if(trace.length > traceLen)
                    trace.shift();
                traceBuffer = {x: dotX, y: dotY};
                //scBuffer = errorToScore(prev_error).toFixed()+'%'; // update realtime score
            }
            /*if(timestep == trialFreeze) { // hide score feedback after a few seconds in new trial
                fbMsg = '';
                topMsg = '';
                if(mode == 0)
                    trialMsg = '';
            }*/
            // motion model
            //var b = offset==0? 1: -1;
            dotX = dotX + deltaT*b_val[offset][0]*constrain(dotU[0]/30,-1,1)*maxV[0];
            dotX = constrain(dotX, -maxX, maxX);
            
            dotY = dotY - deltaT*b_val[offset][1]*constrain(dotU[1]/30,-1,1)*maxV[1];
            dotY = constrain(dotY, -maxY, maxY);
            if(movin) {
                error.push({e:prev_error, w:deltaT});
            }
            prev_error = pathError;
            if(!noSave && inactivity1 > 300) { // pause due to inactivity
                pause();
                return;
            }
        } else { // before trial freeze
            if(freeze < maxTailLen && mode == 0) { // start countdown
                if(freeze <= 60)
                    trialMsg = 'Start';
                //else if(freeze % 60 == 0)
                    //trialMsg = freeze/60;
            } if(freeze <= maxTailLen && isTest!=2) { // hide score and trial when countdown starts
                fbMsg = '';
                topMsg = '';
                //if(mode == 0)
                    //trialMsg = freeze/60;
            }
            freeze -= deltaT;
            if(freeze <= 0) { // start moving
                freeze = 0;
                resetAndUnfreeze();
                trialMsg = '';
                fbMsg = '';
                topMsg = '';
            }
        }
        if(inactivity2 > 0) // decays press button inactivity when active
            inactivity2 = Math.max(inactivity2-deltaT, 0);
        timestep+=deltaT;
    } else { // bottom buttons not pressed
        inactivity2 += deltaT;
        if(inactivity1 > 0) // decays in trial inactivity when inactive
            inactivity1 = Math.max(inactivity1-deltaT, 0);
    }
    dotU = [0,0]; // 0,0
    let nextFrame = timestamp+(1-timestep%1)/0.06;
    gameLoop = setTimeout(()=>requestAnimationFrame(stepTime), nextFrame-performance.now());
}
function draw() {
    if(isDraw) {
        // draw
        clear();
        background('white');
        stroke('black');
        strokeWeight(4);
        noFill();
        translate(window.innerWidth/2, (window.innerHeight-touchSize)/2);
        //rotate(-screen.orientation.angle/180*PI);
        rect(-maxX*scaling, -maxY*scaling, maxX*scaling*2, maxY*scaling*2);
        
        drawCurve(lines[blanknum], Math.floor(timestep-1));
        drawCursor();
        drawTrace();
        drawOverlay();
        // save framerate
        fr = frameRate();
        if(timestep%10<1)
            frBuffer = fr.toFixed();
        fps[0] += fr;
        fps[1]++;
    }
}
function startTrial() { // init new trial
    dis_temp = []; 
    act_temp = [];
    tim_temp = [];
    rew_temp = [];
    dotX = lines[blanknum][0].x;
    dotY = lines[blanknum][0].y;
    dotU = [0,0];
    inactivity1 = 0;
    inactivity2 = 0;
    trace = [];
    traceBuffer = null;
    tailLen = maxTailLen*blank[blanknum];
    freeze = trialFreeze;
    freeze2 = 1;
    timestep = 0;
    error = [];
    prev_error = 0.0;
    reward = 0;
    scoreBuffer = [0,0];
    offset = offsets.constructor === Array? offsets[blanknum] : offsets;
    trialSoundState = 0;
}
function resetAndUnfreeze() { // unpause handler
    dotU = [0,0];
}
function runDraw() { // bind event listteners to start main loop
    clear();
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    //screen.orientation.addEventListener("change", handleOrientationChange);
    window.addEventListener('touchstart', handleTouchEvent);
    //window.addEventListener('touchmove', handleTouchEvent);
    window.addEventListener('touchcancel', handleTouchEvent);
    window.addEventListener('touchend', handleTouchEvent);
    //if(gameLoop) clearInterval(gameLoop);
    //gameLoop = setInterval(stepTime, 1000/60);
    if(gameLoop) clearTimeout(gameLoop);
    gameLoopTime = null;
    gameLoop = requestAnimationFrame(stepTime);
    loop();
    try {
        //wakeLock = await navigator.wakeLock.request("screen");
        navigator.wakeLock.request("screen").then((x)=>{wakeLock=x});
    } catch (err) {
        // The Wake Lock request has failed - usually system related, such as battery.
        console.log(`${err.name}, ${err.message}`);
    }
}
function pauseDraw() { // unbind event listeners to pause main loop
    //if(gameLoop) clearInterval(gameLoop);
    if(gameLoop) clearTimeout(gameLoop);
    gameLoopTime = null;
    noLoop();
    clear();
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
    //screen.orientation.removeEventListener("change", handleOrientationChange);
    window.removeEventListener('touchstart', handleTouchEvent);
    //window.removeEventListener('touchmove', handleTouchEvent);
    window.removeEventListener('touchcancel', handleTouchEvent);
    window.removeEventListener('touchend', handleTouchEvent);
    if(wakeLock)
        wakeLock.release().then(() => {wakeLock = null;});
}
function errorToScore(e) { // computes score from mse
    //return 360000/(3600+e);
    return 100*exp(-e/4096);
}
function stepScore() { // computes overall score from step reward
    if(isTest == 2)
        return 100*(timestep-trialFreeze)/maxPoints;
    return Math.min(100*scoreBuffer[0]/scoreBuffer[1]/maxReward/0.9, 100);
}
function stepFrameScore(e) { // computes step reward score at current timestep using squared error
    var reward = constrain(maxReward-Math.floor(Math.sqrt(e)/rewardStep), 0, maxReward);
    return reward;
}
//const average = array => array.reduce((a, b) => a.e*a.w + b.e*b.w) / array.length; // compute array mean
function wMean(arr) {
    var mean = 0.;
    for(let i=0;i<arr.length;i++)
        mean += arr[i].e * arr[i].w;
    return mean/arr.length;
}
function trimmedAverage(e, trim=0) { // trimmed mean error: (error array, trim ratio on each side)
  if (e.length < 2) {
    return undefined;
  }
  var sorted = e.toSorted((a, b) => a.e - b.e);
  var n = Math.floor(trim*sorted.length);
  var trimmed = sorted.slice(n, -n);
  return wMean(trimmed);
}
function dist2(v, w) { return (v.x - w.x)**2 + (v.y - w.y)**2 } // squared distance from point to point
function sqError() {
    if(lines==null)
        return 0;
    var target = lines[blanknum][Math.ceil(timestep-trialFreeze)];
    return dist2({x:dotX, y:dotY}, target);
    //return (dotX - target[0])**2 + (dotY - target[1])**2;
}
function getProgressMsg() {
    return 'Trial: '+(sessionComplete+1)+' ('+int(100*sessionComplete/sessionTotal)+'%)';
}
function sinuousCurve(len, isTest) { // generate trajectory
    const step = 0.1;
    var speed = tgtSpeed;
    var ampl = amplitudes;
    var freq = frequency;
    var repeat;
    var phase = [];
    if(isTest<3) {
        repeat = blank.length;
        for(let k=0;k<repeat; k++) {
            let rand_start = random()*2*PI; // same trajectory but random starting position for test
            let phase_t = [[],[]];
            for(let i=0; i<freq[0].length; i++)
                phase_t[0].push(rand_start*freq[0][i]/freq[0][0]);
            for(let i=0; i<freq[1].length; i++)
                phase_t[1].push(rand_start*freq[1][i]/freq[0][0]);
            phase.push(phase_t);
        }
    } else {
        repeat = blank.length;
        for(let k=0;k<repeat; k++) {
            let phase_t = [[],[]];
            for(let i=0; i<freq[0].length; i++) // random phases for each frequency
                phase_t[0].push(random()*2*PI);
                for(let i=0; i<freq[1].length; i++)
                phase_t[1].push(random()*2*PI);
            phase.push(phase_t);
        }
    }
    var paths = [];
    pOffsets = phase;
    for(let k=0; k<repeat; k++) {
        let X = 0; // put starting coordinate into points
        let Y = 0;
        for(let i=0; i<ampl[0].length; i++) {
            X += ampl[0][i]*sin(phase[k][0][i]);
            Y += ampl[1][i]*cos(phase[k][1][i]);
        }
        points = [{x:X, y:Y}];
        let dis = 0;
        let start = step;
        let prev_pt = points[0];
        for(let i=1; i<len+maxTailLen; i++) {
            if(isTest == 2)
                speed = Math.min(i*0.03,tgtSpeed);
            while(dis < speed) { // add next point of SPEED distance away
                let post_pt = {x:0, y:0};
                for(let j=0; j<ampl[0].length; j++) {
                    post_pt.x += ampl[0][j]*sin(2*PI*start*freq[0][j]+phase[k][0][j]);
                    post_pt.y += ampl[1][j]*cos(2*PI*start*freq[1][j]+phase[k][1][j]);
                }
                dis += Math.sqrt(dist2(post_pt, prev_pt));
                prev_pt = post_pt;
                start += step;
            }
            points.push(prev_pt);
            dis -= speed;
        }
        paths.push(points);
    }
    return paths;
}
function arrayRotate(arr, count) { // rotates array, ex. arrayRotate([0, 1, 2, 3, 4, 5], 2) -> [2, 3, 4, 5, 0, 1]
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
function drawCurve(coords, timestep) {
    if(coords!==null) {
        noFill();
        let time = Math.max(timestep-trialFreeze+tailLen, tailLen);
        let start = Math.max(time - tailLen, 0);
        let targt = Math.max(time - tailLen, 0);
        let c = 0; // 128
        strokeWeight(20); // 6
        stroke(0,135,0);
        for(let i = start+2; i<time-1; i++) {
            //stroke(c*2,135+c,c*2); // c,255,c
            line(coords[i-1].x*scaling, -coords[i-1].y*scaling, coords[i].x*scaling, -coords[i].y*scaling);
            //c += 1; // 1
        }
        strokeWeight(16); // 6
        stroke('yellow');
        for(let i = start+1; i<time; i++) {
            line(coords[i-1].x*scaling, -coords[i-1].y*scaling, coords[i].x*scaling, -coords[i].y*scaling);
        }
        push();
        strokeCap(SQUARE);
        if(time-2 > start) {
            let v = unitVector(coords[time-1].x*scaling-coords[time-2].x*scaling, coords[time-1].y*scaling-coords[time-2].y*scaling);
            line(coords[time-2].x*scaling, -coords[time-2].y*scaling, (coords[time-1].x*scaling+(v[0])*10), -(coords[time-1].y*scaling+(v[1])*10));
        }
        strokeWeight(2);
        strokeCap(ROUND);
        stroke('green');
        for(let i = start+1; i<time; i++) {
            if(i%10 == 8) {
                line(coords[i-1].x*scaling, -coords[i-1].y*scaling, coords[i].x*scaling, -coords[i].y*scaling);
            }
        }
        pop();
        stroke('green'); // grey
        strokeWeight(4);
        if(isTest == 2) {
            fill('white');
            ellipse(coords[targt].x*scaling, -coords[targt].y*scaling, 24,24); // 16
            /*noFill();
            strokeWeight(2);
            ellipse(coords[targt].x*scaling, -coords[targt].y*scaling, 2*bubbleSize*scaling,2*bubbleSize*scaling);*/
        } else {
            if(reward == 0 || mode >0)
                fill('white');
            else if(reward == 3)
                fill('green');
            else if(reward == 2)
                fill('lightgreen');
            else if(reward == 1)
                fill('yellow');
            else
                fill('white');
            ellipse(coords[targt].x*scaling, -coords[targt].y*scaling, 24,24); // 16
        }
    }
}
function vectorSize(x, y) {
   return Math.sqrt(x * x + y * y);
} 
function unitVector(x, y) {
   const magnitude = vectorSize(x, y);
   // We need to return a vector here, so we return an array of coordinates:
   return [x / magnitude, y / magnitude]; 
}
function drawCursor() {
    var color = b_col[offset];
    if(freeze>0) {
        if(freeze%30<16) {
            let heading = 0;
            let x = dotX*scaling;
            let y = -dotY*scaling;
            let A = 0;
            let d = 0;
            stroke(color);
            fill(color);
            noStroke();
            ellipse(dotX*scaling, -dotY*scaling, 20,20);
            strokeWeight(3);
        }
    } else {
        stroke(color);
        fill(color);
        noStroke();
        ellipse(dotX*scaling, -dotY*scaling, 20,20);
        stroke('grey');
        strokeWeight(1);
        let txtSize = Math.floor(12*scaling);
        textSize(txtSize);// draw score
        stroke('black');
        fill('black');
        strokeWeight(1);
        //text(scBuffer, lines[blanknum][timestep-trialFreeze].x*scaling, -lines[blanknum][timestep-trialFreeze].y*scaling+txtSize);
        //text(scBuffer, dotX*scaling, -dotY*scaling+txtSize);
        if(reward > 0 && mode == 0)
            text('+'+reward, dotX*scaling, -dotY*scaling-txtSize);
        else if(reward < 0) {
            stroke('red');
            fill('red');
            text('Too Far!', dotX*scaling, -dotY*scaling-txtSize);
        }
    }
}
function drawTrace() { // draw trace behind player
    var baseColor = color(b_col[offset]);
    var transparency = 0;
    var increment = 255/traceLen;
    strokeWeight(3);
    for(let i in trace) {
        baseColor.setAlpha(transparency);
        stroke(baseColor);
        fill(baseColor);
        ellipse(trace[i].x*scaling, -trace[i].y*scaling, 2, 2);
        transparency += increment;
    }
}
function drawOverlay() {
    stroke('black');
    fill('black');
    textAlign(CENTER,CENTER);
    strokeWeight(1);
    if(freeze2 > 0) {
        push();
        noStroke();
        fill(128,128,128,128);
        rect(-cnv_wid/2, -(cnv_hei-touchSize)/2, cnv_wid, cnv_hei+touchSize);
        pop();
        /*textSize(Math.floor(12*scaling));
        if(touchState[2])
            text('Keep buttons pressed to resume: '+Math.ceil(freeze2/60), 0, 0);
        else
            text("Touch the button on both sides to start!", 0, 0);*/
    } else if(mode == 4) {
        textSize(12);
        text("FPS: "+frBuffer, maxX*scaling-30, -maxY*scaling+10);
        /*textSize(Math.floor(12*scaling));
        text("Please wait while the \ngraphics test is underway...", 0, 0);*/
    }
    textSize(Math.floor(12*scaling));
    text(topMsg, 0, -maxY*scaling*0.9);
    text(fbMsg, 0, -maxY*scaling/2);
    text(midMsg, 0, 0);
    if(freeze2 < 2) {
        push();
        let color = b_col[offset];
        //textSize(Math.floor(24*scaling));
        stroke(color);
        fill(color);
        text(trialMsg, 0, maxY*scaling/2);
        pop();
    }
    if(touchState[0]) {
        noStroke();
        fill('grey');
    } else {
        stroke('grey');
        if(inactivity2 % 60 < 30) {
            push();
            strokeWeight(1);
            stroke('black');
            fill('black');
            text("Press", -maxX*scaling+touchSize/2, maxY*scaling+touchSize/2);
            pop();
        }
        /*stroke('grey');
        strokeWeight(1);
        fill('grey');
        text("Press", -maxX*scaling+touchSize/2, maxY*scaling+touchSize/2);*/
        strokeWeight(6);
        noFill();
    }
    ellipse(-maxX*scaling+touchSize/2, maxY*scaling+touchSize/2, touchSize,touchSize);
    if(touchState[1]) {
        noStroke();
        fill('grey');
    } else {
        stroke('grey');
        if(inactivity2 % 60 < 30) {
            push();
            strokeWeight(1);
            stroke('black');
            fill('black');
            text("Press", maxX*scaling-touchSize/2, maxY*scaling+touchSize/2);
            pop();
        }
        /*stroke('grey');
        strokeWeight(1);
        fill('grey');
        text("Press", maxX*scaling-touchSize/2, maxY*scaling+touchSize/2);*/
        strokeWeight(6);
        noFill();
    }
    ellipse(maxX*scaling-touchSize/2, maxY*scaling+touchSize/2, touchSize,touchSize);
}
function pause() { // pause due to inactivity
    pauseDraw();
    //isdraw = false;
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    select('#container-exp').hide()
    let button = document.getElementById("startBt");
    instr.html(`<br>Are you still there?<br><br>The experiment has been paused because we cannot detect any movement for a few seconds.<br><span id="endInstr-span">Click the button to return to the experiment.</span>`);
    timer = setTimeout(()=>{select('#endInstr-span').html("Please click the button now or the experiment will terminate.");document.getElementById("endInstr-span").style.color = "red";
                            timer = setTimeout(()=>{forceQuit(2);},60000);},120000);
    butfunc = ()=>{select('#endDiv').hide();resume();};
    button.onclick = ()=>{clearTimeout(timer);butfunc();};
}
function resume() {
    isDraw = true;
    inactivity1 = 0;
    inactivity2 = 0;
    touchesList = [];
    select('#container-exp').show()
    runDraw();
}
function startBreak(len) { // len-minutes break
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    timerCount = 20*len;
    graceTime = 180; // participants have 120 seconds to click next button after break timer runs out
    instr.html(`<br>Let's take a ${timerCount} seconds break.<br><br>${Math.floor(timerCount/60)} : ${String(timerCount%60).padStart(2,'0')}`);
    select('#startBt').hide();
    timer = setInterval(breakCountDown, 1000);
}
function breakCountDown() { // timer countdown for break
    timerCount--;
    if(timerCount>0) {
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]*20} seconds break.<br><br>${Math.floor(timerCount/60)} : ${String(timerCount%60).padStart(2,'0')}`);
    } else if(timerCount == 0) {
        let btn = document.getElementById("startBt");
        select('#endInstr').html(`<br><br><br>Please click the button and proceed with the experiment.<br>`);
        btn.style.display = 'inline-block';
        btn.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; clearInterval(timer); trainBlockStart();};
    } else {
        if(graceTime+timerCount==120) {
            select('#endInstr').html(`<br><br><br><span style="color:red;">Are you still there? Please click the button in 2 minutes or the experiment will terminate.</span>`); // show timer : <br><span style="color:red;">${Math.floor((graceTime+timerCount)/60)} : ${String((graceTime+timerCount)%60).padStart(2,'0')}</span>
        } else if(graceTime+timerCount==-1) { // timeout
            clearInterval(timer);
            butfunc = ()=>{select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
            forceQuit(2);
        }
    }
}
function startBackTimer() { // starts inactivity background timer
    timerCount = 120;
    timer = setTimeout(inactivityTimer, 60000);
}
function handleDeviceOrientation(e) {
    if(movin &&touchState[2]) {
        dotU[1] = e.beta;
        dotU[0] = e.gamma;
    }
}
function handleOrientationChange(e) {
    console.log(e.target.angle);
    windowResized();
}
function handleTouchEvent(e) {
    /*if (e.touches.length>1) { // disable zooming etc. If there is more than one touch
        e.preventDefault();
    }*/
    touchesList = e.touches;
    //console.log(touches);
}
function handleTrialSoundEnd(e) {
    trialSoundState = 0;
}
function computeSessionTotal() {
    var t=0;
    let x=[0,3,10,10,5,5,5,5,15,15];
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
    document.body.style.overflow = 'auto';
    pauseDraw();
    if(reason == 2) {
        timerCount = 120;
        //show('failed-2-return', 'failed-2-disqualify');
        timer = setTimeout(()=>{show('failed-2-disqualify', 'failed-2-return');remove();helpEnd();}, timerCount*1000);
        let btn = document.getElementById("returnBt");
        btn.onclick = ()=>{select('#failed-2').hide();show('container-exp', 'container-failed');document.body.style.overflow = 'hidden';clearTimeout(timer);butfunc();};
    } else {
        remove();
        //screen.orientation.unlock();
        helpEnd();
    }
}
function startGame() {
    //trialAudioObj = new Audio(trialSoundSrc[maxReward-1]); // init audio for ios Safari from user interaction
    trialAudioObj = new Audio();
    //trialAudioObj.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
    trialAudioObj.src = trialSoundSrc[trialSoundSrc.length-1];
    trialAudioObj.play();
    var values = document.getElementsByName('cover-select');
    /*if(values[2].value == '1') {
        if(!values[0].value || !values[1].value) {
            alert('The id cannot be empty!');
            return;
        }
    }*/
    if(typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
            if (permissionState === 'granted') {
                //do something if necessary
            } else {
                return;
            }
        }).catch(console.error);
    }
    /*id = values[0].value;
    exDay = Number(values[1].value);
    noSave = Number(values[2].value)!=1;*/
    id = '';
    exDay = 0;
    noSave = true;
    let nor = Number(values[0].value);
    if(nor == 0)
        trainBlocks = [4]; // 4
    else
        trainBlocks = [5];
    //trainBlocks = [1];
    let trajChoice = Number(values[1].value);
    //amplitudes = amplitudes_select[trajChoice];
    //frequency = frequency_select[trajChoice];
    
    
    cnv = createCanvas(window.innerWidth, window.innerHeight);
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    cnv_hei = window.innerHeight;
    cnv_wid = window.innerWidth;
    let sx = cnv_wid/width_x;
    let sy = (cnv_hei-touchSize)/width_x/1.5;
    scaling_base = sx < sy? sx:sy;
    select('#instrDiv').hide();
    totalTrainBlocks = trainBlocks.length;
    sessionComplete = 0;
    highscore = [-1,-1];
    sessionTotal = computeSessionTotal();
    trainBlockStart();
}
// Function that ends the game appropriately after the experiment has been completed
function endGame() {
    select('#container-exp').hide();
    pauseDraw();
    remove();
}
function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight, true);
    cnv_hei = window.innerHeight;
    cnv_wid = window.innerWidth;
    // set scaling depending on screen size
    let sx = cnv_wid/width_x;
    let sy = (cnv_hei-touchSize)/width_x/1.5;
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