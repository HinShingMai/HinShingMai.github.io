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
let ver = 'denovo-0_51';
let cnv;
var cnv_hei;
var cnv_wid;
let dpi = -1;
let currentTrainBlock = 0;
//let trainBlocks = [6, 4, 4, 4, 4, -3, 4, 4, 7, 5, 5, -3, 5, 5, 5, 5];
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
let amplitudes = [[2.31, 2.31, 2.31, 1.76, 1.30, 0.97],[2.31, 2.31, 2.31, 1.58, 1.03, 0.81]];
let frequency = [[0.1, 0.25, 0.55, 0.85, 1.15, 1.55],[0.15, 0.35, 0.65, 0.95, 1.45, 1.85]];
let frameNum = 0; // Number of frames in the current session
var dotX;
var dotY;
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
var ang;
var act;
var id;
//var blockErr = [];
//var blockErrn_x = [];
//var blockErrn = [];
//var blockErrr_x = [];
//var blockErrr = [];
//var blockNam = [];
var isTest;
var maxPoints;
var exDay;
var fps;
var error;
var errors;
var prev_error;
var path = null;
var pathWidth = 15;
var vDist;
var trace;
var traceBuffer;
var traceLen = 10;
var inactivity;
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
var erBuffer;
var fbMsg;
var freeze;
var freeze_time = 200;
var freeze_margin;
var dotU = [0,0];
var maxV = [3,3];
var maxTailLen = 120;
var tailLen;
var noSleepState = false;
var wakeLock;
function setup() {
    isDraw = false;
    frameRate(60);
    randomSeed(1024);
}
function trainBlockStart() {
    blockType = trainBlocks[currentTrainBlock];
    // arrange sessions in a block
    /*
        2: normal predict test
        3: reverse predict test
        4: normal testing session
        5: reverse testing session
        6: normal training session
        7: reverse training session
    */
    if(blockType<0) {
        startBreak(-blockType);
        return;
    } else if(blockType<2) {
        sessionsType = [blockType];
    } else {
        let type = blockType%4;
        if(type < 2) {
            if(type == 0) {
                sessionsType = [6];
            } else if(type == 1) {
                sessionsType = [7];
            }
        } else {
            if(type == 2) {
                sessionsType = [2];
            } else {
                sessionsType = [3];
            }
        }
    }
    sessions = sessionsType.length;
    currentSession = 0;
    //sessionInfo();
    startSession();
}
function sessionNext() {
    pauseDraw();
    currentSession++;
    sessionComplete++;
    sessionInfo();
}
function startSession() {
    isDraw = true;
    select('#container-exp').show()
    dis = []; 
    //vDist = [];
    //ang = [];
    act = [];
    isTest = sessionsType[currentSession]<6;
    offset = sessionsType[currentSession]%2;
    if(isTest) {
        maxPoints = 3600;
        blanknum = 0;
        maxY = width_x*0.75; //180
        maxX = width_x/2; //120
        scaling = scaling_base;
        if(sessionsType[currentSession]>3) // 1 minute test
            blank = [1]; // 1 sub-sessions
        else // 10 minutes predict test
            blank = [1].concat(shuffle([0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]));
    } else {
        maxPoints = 3600;
        blanknum = 0;
        maxY = width_x*0.75; //180
        maxX = width_x/2; // 120
        scaling = scaling_base;
        blank = [1,1,1,1,1,1]; // 6 sub-sessions
    }
    if(sessionsType[currentSession]>1) {
        lines = sinuousCurve(maxPoints, isTest);
    }
    errors = [];
    movin = true;
    fps = 0.0;
    frBuffer = 60.0;
    fbMsg = ' ';
    startTrial();
    runDraw();
    //noSleep();
}
function sessionInfo() {
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    let plot = select('#plot');
    var mse;
    htmlDiv.show();
    if(lines!=null && currentSession > 0) { // handles data
        mse = 100000/(1000+average(errors)); // average(errors)
        /*blockErr.push(mse);
        blockNam.push((isTest?'Test':'Train')+sessionComplete);
        if(offset == 0) {
            blockErrn.push(mse);
            blockErrn_x.push((isTest?'Test':'Train')+sessionComplete);
        } else {
            blockErrr.push(mse);
            blockErrr_x.push((isTest?'Test':'Train')+sessionComplete);
        }*/
        // Record data
        let avgfps = fps/dis.length;
        let blockData = {
            xh: lines,
            x: dis,
            //y: vDist,
            //a: ang,
            u: act,
            num: sessionComplete,
            type: sessionsType[currentSession-1],
            hori: blank,
            offs: pOffsets,
            err: errors,
            id: id,
            fps: fps/dis.length,
            time: new Date().toISOString(),
            day: exDay,
            version: ver,
            scale: scaling
        }
        console.log(blockData)
        recordTrialSession(blockData);
        //subject.progress++;
        /*if(sessionComplete<4&&avgfps<50) { // Screen out participants
            forceQuit(1);
        }*/
        if(isTest) {
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
                msg = `<br><br>Congratulations! Your score improved better! Keep it up!<br><br>Best performance score: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            } else {
                //msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance error: ${highscore[offset].toFixed()}`;
                msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance score: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            }
            plot.show();
            plot.html(msg);
        } /*else {
            // Define Data for plotting
            let data = [
                {x: lines[0].map(x => x[0]), y: lines[0].map(x => x[1]), type: 'scatter', mode: 'lines', line: {color: 'black', width: 3}, name: 'Path'},
                {x: vDist[0], y: dis[0], type: 'scatter', mode: 'lines', line: {color: 'blue', width: 3}, name: 'You'},
            ];
            // layout
            var layout = {
                title: 'Trajectory',
            };
            let size = Math.min(document.getElementById('endMsg').offsetWidth, document.getElementById('endMsg').offsetHeight);
            document.getElementById('plot').style.height = size+'px';
            document.getElementById('plot').style.width = size+'px';
            // Display using Plotly
            plot.show();
            plot.html("");
            Plotly.newPlot("plot", data, layout, {responsive: true});
        }*/
    } else {
        mse = -1.0;
        plot.hide();
    }
    mse = mse.toFixed();
    select('#container-exp').hide()
    let button = document.getElementById("startBt");
    timer = setTimeout(()=>{select('#endInstr-span').html("Are you still there? Please click the button now or the experiment will terminate.");document.getElementById("endInstr-span").style.color = "red";
                            timer = setTimeout(()=>{forceQuit(2);},60000);},60000);
    if(currentSession < sessions) { // proceed to next session
        let prev_offset = sessionsType[currentSession-1]%2;
        testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
        let color = prev_offset==0? "blue":"red";
        if(firstTrial[prev_offset])
            firstTrial[prev_offset] = false;
        if(mse < 0)
            instr.html(`</br>Experiment Progress: ${int(sessionComplete/sessionTotal*100)}%<br><br><span id="endInstr-span"> </span>`);
        else
            instr.html(`</br>Experiment Progress: ${int(sessionComplete/sessionTotal*100)}%<br>Average Score: ${mse}<br><span id="endInstr-span"> </span>`);
        butfunc = ()=>{plot.hide();select('#endDiv').hide();startSession();};
    } else { // end of a block
        if(currentTrainBlock+1 < totalTrainBlocks){ // proceed to next block
            if(mse < 0)
                instr.html(`<br>Experiment Progress: ${int(sessionComplete/sessionTotal*100)}%<br><br><br><span id="endInstr-span"> </span>`);
            else
                instr.html(`<br>Experiment Progress: ${int(sessionComplete/sessionTotal*100)}%<br>Average Score: ${mse}<br><br><span id="endInstr-span"> </span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else { // Final block, end game
            instr.html(`<br>Experiment Progress: ${int(sessionComplete/sessionTotal*100)}%<br>Average Score: ${mse}<br><br><span id="endInstr-span"> </span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; endGame();};
        }
    }
    button.onclick = ()=>{clearTimeout(timer);butfunc();};
}
function draw() {
    if(isDraw) {
        if(frameNum >= maxPoints+maxTailLen) {
            // record final trajectories
            let mean_err = error/frameNum;
            dis_temp.push([dotX,dotY]);
            //vDist_temp.push(dotY);
            act_temp.push(dotU);
            dis.push(dis_temp);
            //vDist.push(vDist_temp);
            act.push(act_temp);
            errors.push(mean_err);
            if(blanknum < blank.length-1) { // next sub-session
                blanknum++;
                fbMsg = 'Average Score: '+(100000/(1000+mean_err)).toFixed();
                startTrial();
            } else {
                //console.log("draw end: "+isDraw)
                isDraw = false;
                sessionNext();
                return;
            }
        } /*else if(!movin && dotY>=plen*blanknum+straightLen*0.75) // enable controls after a short freeze at the beginning
            movin=true;*/
        if(freeze<1) {
            // record trajectory
            dis_temp.push([dotX, dotY]);
            //vDist_temp.push(dotY);
            act_temp.push(dotU);
            if(lines!=null) {
                var pathError = sqError();
                if(act_temp.length > 1) {
                    let prev_dotU = act_temp[act_temp.length-2];
                    if(dist2(dotU, prev_dotU) < maxV[0]*0.01) {
                        if(pathError>prev_error*0.9)
                            ;//inactivity += 1;
                    } else if(inactivity > 0)
                        inactivity -= 1;
                    /*if(pathError > pathWidth)
                        inactivity++;*/
                }
            }
            if(frameNum%5 == 0) {
                if(traceBuffer != null)
                    trace.push(traceBuffer);
                if(trace.length > traceLen)
                    trace.shift();
                traceBuffer = {x: dotX, y: dotY};
                //erBuffer = "Score: "+(100000/(1000+pathError)).toFixed();
            }
            if(inactivity > 100) {
                pause();
            }
            if(frameNum > 240) {
                fbMsg = ' ';
            }
            // motion model
            var b = offset==0? 1: -1;
            dotX = dotX + b*fixBetween(dotU[0],-30,30)*maxV[0]/30;
            dotX = fixBetween(dotX, -maxX, maxX);
            
            dotY = dotY - b*fixBetween(dotU[1],-30,30)*maxV[1]/30;
            dotY = fixBetween(dotY, -maxY, maxY);
            if(movin) {
                error += pathError;
            }
            prev_error = pathError;
        } else {
            freeze -= 1;
            if(freeze == 0)
                resetAndUnfreeze();
        }
        dotU = [0,0]; // 0,0
        // draw
        clear();
        background('white');
        stroke('black');
        strokeWeight(4);
        noFill();
        //let high = int(maxY*blank[blanknum]-dotY);
        //translate(cnv_wid/2, cnv_hei/2);
        translate(window.innerWidth/2, window.innerHeight/2);
        //rotate(-screen.orientation.angle/180*PI);
        rect(-maxX*scaling, -maxY*scaling, maxX*scaling*2, maxY*scaling*2);
        stroke('black');
        fill('black');
        textAlign(CENTER,CENTER);
        textSize(12);
        strokeWeight(1);
        text("FPS: "+frBuffer, maxX*scaling-30, -maxY*scaling+10);
        textSize(Math.floor(10*scaling));
        text(fbMsg+"\n\n"+erBuffer, 0, 0);
        
        drawCurve(lines[blanknum], frameNum);
        drawBike();
        drawTrace();
        // save framerate
        fr = frameRate();
        if(frameNum%10==0)
            frBuffer = fr.toFixed();
        fps += fr;
        frameNum++;
    }
}
function startTrial() {
    dis_temp = []; 
    act_temp = [];
    dotX = lines[blanknum][0][0];
    dotY = lines[blanknum][0][1];
    dotU = [0,0];
    inactivity = 0;
    trace = [];
    traceBuffer = null;
    tailLen = maxTailLen*blank[blanknum];
    freeze = maxTailLen;
    frameNum = 0;
    erBuffer = ' ';
    error = 0.0;
    prev_error = 0.0;
}
function resetAndUnfreeze() {
    //dotX = (dotX+lines[-dotY])/2.0;
    dotU = [0,0];
}
function runDraw() {
    clear();
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    screen.orientation.addEventListener("change", handleOrientationChange);
    loop();
    try {
        //wakeLock = await navigator.wakeLock.request("screen");
        navigator.wakeLock.request("screen").then((x)=>{wakeLock=x});
    } catch (err) {
        // The Wake Lock request has failed - usually system related, such as battery.
        console.log(`${err.name}, ${err.message}`);
    }
}
function pauseDraw() {
    noLoop();
    clear();
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
    screen.orientation.removeEventListener("change", handleOrientationChange);
    if(wakeLock)
        wakeLock.release().then(() => {wakeLock = null;});
}
function fixBetween(x, minimum, maximum) {
    if(x < minimum)
        return minimum;
    else if(x > maximum)
        return maximum;
    return x;
}
function linearError() { // horizontal distance to trajectory
    if(dotY>0 || dotY>=lines[blanknum].length)
        return 0;
    return Math.abs(dotX-lines[blanknum][-Math.floor(dotY)]);
}
const average = array => array.reduce((a, b) => a + b) / array.length; // compute array mean
function dist2(v, w) { return (v[0] - w[0])**2 + (v[1] - w[1])**2 } // squared distance from point to point
function sqError() {
    if(lines==null)
        return 0;
    var target = lines[blanknum][frameNum-tailLen];
    return dist2([dotX, dotY], target);
    //return (dotX - target[0])**2 + (dotY - target[1])**2;
}
function sinuousCurve(len, isTest) { // generate trajectory
    const speed = 1;
    const step = 1/180*0.001;
    var ampl = amplitudes;
    var freq = frequency;
    var repeat;
    var offset = [];
    if(isTest) {
        repeat = blank.length;
        for(let k=0;k<repeat; k++) {
            let rand_start = random()*2*PI; // same trajectory but random starting position for test
            let offset_t = [[],[]];
            for(let i=0; i<freq[0].length; i++)
                offset_t[0].push(rand_start*freq[0][i]/freq[0][0]);
            for(let i=0; i<freq[1].length; i++)
                offset_t[1].push(rand_start*freq[1][i]/freq[1][0]);
            offset.push(offset_t);
        }
    } else {
        repeat = blank.length;
        for(let k=0;k<repeat; k++) {
            let offset_t = [[],[]];
            for(let i=0; i<freq[0].length; i++) // random offsets for each frequency
                offset_t[0].push(random()*2*PI);
                for(let i=0; i<freq[1].length; i++)
                offset_t[1].push(random()*2*PI);
            offset.push(offset_t);
        }
    }
    var paths = [];
    pOffsets = offset;
    /*for(let k=0; k<repeat; k++) { // generate each sub-trajectory
        let points = [];
        let start = 0;
        for(let i=0; i<len+maxTailLen; i++) {
            X = 0;
            Y = 0;
            for(let j=0; j<freq[0].length; j++) {
                X += 10*ampl[0][j]*cos(2*PI*start*freq[0][j]+offset[k][0][j]);
                Y += 15*ampl[1][j]*cos(2*PI*start*freq[1][j]+offset[k][1][j]);
            }
            points.push([X, Y]);
            start += 1/180;
        }
        paths.push(points);
    }*/
    for(let k=0; k<repeat; k++) {
        let X = 0; // put starting coordinate into points
        let Y = 0;
        for(let i=0; i<ampl.length; i++) {
            X += 10*ampl[0][i]*cos(offset[k][0][i]);
            Y += 15*ampl[1][i]*cos(offset[k][1][i]);
            //X += maxX/1.5*ampl[i]*sin(offset[k][i]);
            //Y += maxY/1.5*ampl[i]*cos(offset[k][i]);
        }
        points = [[X, Y]];
        let dis = 0;
        let start = step;
        let prev_pt = points[0];
        for(let i=1; i<len+maxTailLen; i++) {
            while(dis < speed) { // add next point of SPEED distance away
                let post_pt = [0, 0];
                for(let j=0; j<ampl.length; j++) {
                    post_pt[0] += 10*ampl[0][j]*cos(2*PI*start*freq[0][j]+offset[k][0][j]);
                    post_pt[1] += 15*ampl[1][j]*cos(2*PI*start*freq[1][j]+offset[k][1][j]);
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
function randTargets(num) { // generate random points for familiarization session
    famTargets = Array(num).fill().map(() => [(random()-0.5)*width_x, 0]);
    for(let i=0;i<num;i++)
        famTargets[i][1] = (i+1)*famTargetInterval;
    famTargetState = Array(num).fill(0);
}
function arrayRotate(arr, count) { // rotates array, ex. arrayRotate([0, 1, 2, 3, 4, 5], 2) -> [2, 3, 4, 5, 0, 1]
    const len = arr.length
    arr.push(...arr.splice(0, (-count % len + len) % len))
    return arr
}
/*function drawCurve(coords, framenum) {
    if(coords!==null) {
        noFill();
        let time = Math.max(framenum-maxTailLen+tailLen, 0)
        let start = Math.max(time - tailLen, 0);
        stroke('lightgray');
        strokeWeight(6);
        for(let i = start+1; i<time; i++)
            line(coords[i-1][0]*scaling, -coords[i-1][1]*scaling, coords[i][0]*scaling, -coords[i][1]*scaling);
        //noStroke();
        //fill('grey');
        stroke('grey');
        ellipse(coords[start][0]*scaling, -coords[start][1]*scaling, 30,30);
    }
}*/
function drawCurve(coords, framenum) {
    if(coords!==null) {
        noFill();
        let time = Math.max(framenum-maxTailLen+tailLen, 0)
        let start = Math.max(time - tailLen, 0);
        let c = 0; // 128
        strokeWeight(24); // 6
        for(let i = start+1; i<time; i++) {
            stroke(c,255,c);
            line(coords[i-1][0]*scaling, -coords[i-1][1]*scaling, coords[i][0]*scaling, -coords[i][1]*scaling);
            c += 2; // 1
        }
        push();
        noStroke();
        fill('white');
        for(let i = start+1; i<time; i++) {
            if(i%20 == 10) {
                let ang = Math.atan2(coords[i+5][1]-coords[i][1], coords[i+5][0]-coords[i][0]);
                //console.log(ang);
                //triangle(coords[i+2][0]*scaling, -coords[i+2][1]*scaling, coords[i][0]*scaling+4*Math.sin(ang), -coords[i][1]*scaling-4*Math.cos(ang), coords[i][0]*scaling-4*Math.sin(ang), -coords[i][1]*scaling+4*Math.cos(ang));
                triangle(coords[i+5][0]*scaling, -coords[i+5][1]*scaling, coords[i][0]*scaling+4*Math.sin(ang), -coords[i][1]*scaling+4*Math.cos(ang), coords[i][0]*scaling-4*Math.sin(ang), -coords[i][1]*scaling-4*Math.cos(ang));
            }
        }
        pop();
        stroke(128,255,128); // grey
        strokeWeight(6);
        fill('white');
        ellipse(coords[start][0]*scaling, -coords[start][1]*scaling, 30,30);
    }
}
function drawBike() {
    if(!movin)
        var color = 'grey';
    else if(offset == 0)
        var color = 'blue';
    else
        var color = 'red';
    if(freeze>0) {
        if(freeze%30<16) {
            let heading = 0;
            let x = dotX*scaling;
            let y = -dotY*scaling;
            let A = 0;
            let d = 0;
            stroke('grey');
            fill('grey');
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
    }
}
function drawTrace() { // draw trace behind triangle
    var baseColor;
    if(offset == 0)
        baseColor = color('blue');
    else
        baseColor = color('red');
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
    inactivity = 0;
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
        btn.style.display = 'block';
        btn.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; clearInterval(timer);sessionComplete++; trainBlockStart();};
    } else {
        if(graceTime+timerCount==120) {
            select('#endInstr').html(`<br><br><br><span style="color:red;">Are you still there? Please click the button in 2 minutes or the experiment will terminate.</span>`); // show timer : <br><span style="color:red;">${Math.floor((graceTime+timerCount)/60)} : ${String((graceTime+timerCount)%60).padStart(2,'0')}</span>
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
function handleDeviceOrientation(e) {
    if(movin) {
        dotU[1] = e.beta;
        dotU[0] = e.gamma;
    }
}
function handleOrientationChange(e) {
    console.log(e.target.angle);
    windowResized();
}
function computeSessionTotal() {
    var t=0;
    let x=[1,1,1,1,2,3,1,1];
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
        trainBlocks = [6]; // 4
    else
        trainBlocks = [7];
    
    
    cnv = createCanvas(window.innerWidth, window.innerHeight);
    //console.log(cnv.size());
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    cnv_hei = window.innerHeight;
    cnv_wid = window.innerWidth;
    /*if(screen.orientation.angle%180 == 0) {
        cnv_hei = window.innerHeight;
        cnv_wid = window.innerWidth;
    } else {
        cnv_hei = window.innerWidth;
        cnv_wid = window.innerHeight;
    }*/
    let sx = cnv_wid/width_x;
    let sy = cnv_hei/width_x/1.5;
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
    //console.log("resized1 "+isDraw);
    resizeCanvas(window.innerWidth, window.innerHeight, true);
    cnv_hei = window.innerHeight;
    cnv_wid = window.innerWidth;
    /*if(screen.orientation.angle%180 == 0) {
        cnv_hei = window.innerHeight;
        cnv_wid = window.innerWidth;
    } else {
        cnv_hei = window.innerWidth;
        cnv_wid = window.innerHeight;
    }*/
    // set scaling depending on screen size
    let sx = cnv_wid/width_x;
    let sy = cnv_hei/width_x/1.5;
    scaling_base = sx < sy? sx:sy;
    scaling = scaling_base;
    //console.log("resized2 "+isDraw);
}
function show(shown, hide) {
    document.getElementById(shown).style.display = 'block';
    document.getElementById(hide).style.display = 'none';
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    return false;
}
function helpEnd() {}