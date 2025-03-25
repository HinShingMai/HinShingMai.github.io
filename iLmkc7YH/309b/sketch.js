var noSave = false;
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
    let dat_id = 'star/'ver+'/'+id+'_'+session.day+'_'+session.num+'_'+session.type;
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
let ver = 'star-0.2';
var id;
let cnv;
let dpi = -1;
let currentTrainBlock = 0;
//let trainBlocks = [0,1,-1,1,-1,1,-1,1,-1,1,-10,1,2,0];
let trainBlocks = [0, 2, 1];
/*
-n: n-minutes break
0: no path normal familiarization block
4: normal training block
5: reverse training block
6: normal testing block
7: reverse testing block
*/
let totalTrainBlocks;
let offsets = [1,-1];
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
var pLines;
var currentSession;
var sessions;
var blockType;
var isDraw;
var dis;
var vDis;
var exDay = 1;
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
var pathWidth = 10;
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
var mode;
var modes;
var SAT1_score;
var score_max;
var score_base;
var speed_scale;
var dis_instr;
var feedback_rk;
var giveFeedback = 1;
var butfunc;
var keyfunc;
var rank;
var ding = [new Audio('./ding-1-c.mp3'), new Audio('./ding-13-c.mp3'), null, new Audio('./ding-25-c.mp3')];
var startVertex;
var vertexTouched;
var curVertex;
var nextVertex;
var vertexTouchTime = 3;
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
    dis_temp = [];
    vDis_temp = [];
    maxPoints = 0;
    maxPoints = 300;
    maxX = width_x*0.625; //150
    maxY = maxX;
    scaling = scaling_base;
    dotX = 0;
    dotY = maxY/2;
    lines = [];
    pLines = [];
    if(sessionsType[currentSession] == 0) { // familiarization session
        if(currentTrainBlock==0) {
            document.onkeyup = handleCalibrationKey;
            mode = 2; // 0: normal, 1: mirrored, 2/3: mouse calibration, 4: no-feedback straight, 5: no-feedback trial, 6: traj feedback trial
            modes = Array(5).fill(0);
            movin = -60; // 1: in trial, 0: awaiting cursor to move back to starting position(resetting), <0: inter-trial cooldown
        } else {
            mode = -1;
            modes = Array(5).fill(4);
            movin = -60;
        }
        offset = 0;
        document.getElementById("container-exp").onmousemove = handleMouseMove;
        lines = star(0, 0, 6, 50, 100); // star(0, 0, 6, 115, 200);
        pLines.push(star(0, 0, 6, 50+pathWidth, 100+pathWidth*2));
        pLines.push(star(0, 0, 6, 50-pathWidth, 100-pathWidth*2));
    } else {
        document.getElementById("container-exp").onmousemove = handleMouseMove;
        mode = -1;
        if(sessionsType[currentSession] == 1) { // baseline block
            modes = Array(5).fill(0);
            offset = 0;
        } else { // mirror block
            modes = Array(10).fill(1);
            offset = 1;
        }
        //modes = Array(40).fill(0);
        movin = -60;
        lines = star(0, 0, 6, 50, 100);
        pLines.push(star(0, 0, 6, 50+pathWidth, 100+pathWidth*2));
        pLines.push(star(0, 0, 6, 50-pathWidth, 100-pathWidth*2));
    }
    vertexTouched = Array(lines.length).fill(0);
    startVertex = 0;
    curVertex = startVertex;
    nextVertex = [1]; // [1, lines.length-1];
    blank = modes.length;
    clear();
    dis_instr = 1;
    blanknum = 0;
    frameNum = 0;
    error = [];
    errors = [];
    fps = 0.0;
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
            num: sessionComplete,
            type: sessionsType[currentSession-1],
            len: blank,
            id: id,
            fps: fps/dis.length,
            version: ver,
            scale: scaling,
            error: errors,
            score: scores.slice(scores.length-blank, scores.length),
            day: exDay
        }
        console.log(blockData)
        recordTrialSession(blockData);
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
                vDis_temp.push(dotY);
                //actx.push(dotA);
                //acty.push(dotB);
                //nse.push(noise);
                var pathError = distToPath();
                var inPath = pathError < pathWidth**2;
                error.push(pathError);
                if(checkAllVertexTouched()) {
                    dis.push(dis_temp);
                    vDis.push(vDis_temp);
                    errors.push(error);
                    if(giveFeedback > 0) { // feedback
                        //let mean_speed = SAT1_score[0]/SAT1_score[2];
                        let mean_error = SAT1_score[1]/SAT1_score[2]; // SAT_score = [time taken, sum of error, n]
                        movin = -120;
                        let score = 400/(mean_error+400)*2000/(SAT1_score[0]+2000);
                        scores.push([mean_error,SAT1_score[0],score]);
                        score_max = fixBetween(score*100, 0, 100).toFixed(0);
                        if(scores.length<5) { // compute current score relative to last 20 trials after 5 trials
                            feedback_rk = -1;
                            ding[1].play();
                        } else {
                            /*let startpos = Math.max(0, scores.length-20);
                            let meanStd = getMeanStd(scores.slice(startpos, scores.length)); // [mean, std]
                            feedback_rk = fixBetween(Math.floor((score-meanStd[0])/meanStd[1]/0.66)+2, 0, 3);
                            feedback_rk = 1;
                            ding[feedback_rk].play();*/
                            feedback_rk = -1;
                            ding[1].play();
                        }
                    } else { // nofeedback
                        //let mean_speed = SAT1_score[0]/SAT1_score[2];
                        let mean_error = SAT1_score[1]/SAT1_score[2];
                        movin = -60;
                        let score = 400/(mean_error+400)*2000/(SAT1_score[0]+2000);
                        scores.push(score);
                    }
                    blanknum++;
                    dotA = 0.0;
                    dotB = 0.0;
                    error = [];
                    vertexTouched = Array(lines.length).fill(0);
                    startVertex = 0;
                    curVertex = startVertex;
                    nextVertex = [1]; // [1, lines.length-1];
                    frameNum = 0;
                    return;
                }
                // motion model
                dotA = fixBetween(dotA,-100,100);
                dotX = fixBetween(dotX + offsets[offset]*dotA, -maxX, maxX);
                dotB = fixBetween(dotB,-100,100);
                dotY = fixBetween(dotY + dotB, -maxY, maxY);
                //update SAT feedback
                let v = Math.sqrt(dotA**2+dotB**2);
                SAT1_score[0] += 1;
                SAT1_score[1] += pathError*v;
                SAT1_score[2] += v;
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
            translate(windowWidth/2, windowHeight/2);
            rect(-maxX*scaling, -maxY*scaling, maxX*scaling*2, maxY*scaling*2);
            drawStar(offset==0);
            drawCursor(offset==0);
            drawTrace(offset==0);
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
            translate(windowWidth/2, windowHeight/2);
            rect(-maxX*scaling, -maxY*scaling, maxX*scaling*2, maxY*scaling*2);
            drawReturnCursor();
            frameNum++;
            if(movin<-1)
                movin += 1;
            else if(movin<0) {
                movin += 1;
                dotY = lines[startVertex].y-20;
                dotX = lines[startVertex].x;
            } else if(movin==0) {
                if(delay > 0)
                    delay -= 1;
                else if(delay==0) {
                    if(blanknum < blank) {
                        dotX = lines[startVertex].x;
                        dotY = lines[startVertex].y;
                        dis_temp = [];
                        vDis_temp = [];
                        SAT1_score = [0.0,0.0,0];
                        frameNum = 0;
                        movin = 1;
                        let next_mode = modes[blanknum];
                        dis_instr = 0;
                        delay = 30;
                        mode = next_mode;
                    } else {
                        isDraw = false;
                        sessionNext();
                        return;
                    }
                } else {
                    let x = dotX - lines[startVertex].x;
                    let y = dotY - lines[startVertex].y;
                    if(x>-10 && x<10 && y>-10 && y<10) 
                        delay = 30;
                }
            }
        }
        stroke('gray');
        fill('gray');
        textSize(12);
        strokeWeight(1);
        text(`${currentTrainBlock} - ${blanknum}/${blank}`, maxX*scaling-50, maxY*scaling-10);//sMargin*scaling+10
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
    /*var minDist = 4 * maxX*maxX;
    for(let i = 1; i<lines.length; i++) {
        let dist = distToSegmentSquared({x: dotX, y: -dotY}, lines[i-1], lines[i]);
        if(dist < minDist)
            minDist = dist;
    }*/
    var minDist = distToSegmentSquared({x: dotX, y: dotY}, lines[curVertex], lines[nextVertex[0]]);
    //console.log(minDist);
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
function checkAllVertexTouched() {
    for(let i=0; i<nextVertex.length; i++) {
        if((dotX-lines[nextVertex[i]].x)**2+(dotY-lines[nextVertex[i]].y)**2 < pathWidth**2) {
            vertexTouched[nextVertex[i]] += 1;
            if(vertexTouched[nextVertex[i]] > vertexTouchTime) {
                if(nextVertex[i] == startVertex)
                    return true;
                let left = (nextVertex[i]+vertexTouched.length-1)%vertexTouched.length;
                let right = (nextVertex[i]+1)%vertexTouched.length;
                let nextVertex_new = [];
                if(left!== curVertex && vertexTouched[left] <= vertexTouchTime)
                    nextVertex_new.push(left);
                if(right!== curVertex && vertexTouched[right] <= vertexTouchTime)
                    nextVertex_new.push(right);
                curVertex = nextVertex[i];
                nextVertex = nextVertex_new;
            }
        } else
            vertexTouched[nextVertex[i]] = Math.max(vertexTouched[nextVertex[i]]-1,0);
    }
    return false;
}
function star(x, y, num_points, inner_radius, outer_radius) {
    const angle = TWO_PI / num_points; // angle between two points
    const halfAngle = angle / 2.0; // angle between point and valley
  
    var vertices = [];
    for (let a = 0; a < TWO_PI-halfAngle; a += angle) {

        let sx = x + cos(a) * outer_radius;
        let sy = y + sin(a) * outer_radius;
        vertices.push({x: sx, y: sy}); // vertex at point of star

        sx = x + cos(a + halfAngle) * inner_radius;
        sy = y + sin(a + halfAngle) * inner_radius;
        vertices.push({x: sx, y: sy}); // vertex at valley

    }
    return vertices;
}
function drawStar(state) {
    stroke('gray');
    for(let j=0; j<pLines.length; j++) {
        beginShape();
        for(let i = 0; i<pLines[j].length; i++) {
            vertex(pLines[j][i].x*scaling, -pLines[j][i].y*scaling);
        }
        endShape(CLOSE);
    }
    stroke('lightgray');
    beginShape();
    for(let i = 0; i<lines.length; i++) {
        vertex(lines[i].x*scaling, -lines[i].y*scaling);
    }
    endShape(CLOSE);
    if(delay == -1) {
        for(let i=0; i<lines.length; i++) {
            if(movin<1 || vertexTouched[i] > vertexTouchTime) {
                if(state) {
                    fill('blue');
                    stroke('blue');
                } else {
                    stroke('red');
                    fill('red');
                }
                ellipse(lines[i].x*scaling, -lines[i].y*scaling, pathWidth*2, pathWidth*2);
            } else if(nextVertex.includes(i)) {
                stroke('lightgray');
                noFill();
                ellipse(lines[i].x*scaling, -lines[i].y*scaling, pathWidth*2*(1-vertexTouched[i]/vertexTouchTime)*scaling, pathWidth*2*(1-vertexTouched[i]/vertexTouchTime)*scaling);
            }/*else {
                stroke('lightgray');
                //fill('gray');
                noFill();
                ellipse(lines[i].x*scaling, lines[i].y*scaling, pathWidth*8, pathWidth*8);
            }*/
        }
        if(movin>0) {
            fill('white');
            stroke('white');
            strokeWeight(1);
            textSize(Math.floor(10*scaling));
            text("Start!", 0, 0);
        }
    }
}
function drawInstr() {
    fill('white');
    stroke('white');
    textSize(Math.floor(10*scaling));
    strokeWeight(1);
    textAlign(CENTER,CENTER);
    if(dis_instr == 1) {
        text("Try to trace the curved path without the cursor.", 0, 0);
    } else if(dis_instr == 2) {
        text("No-Feedback: In most of the trials, the cursor is not displayed.\n"+
        "You need to guess your position.", 0, 0);
    } else if(dis_instr == 3) {
        text("Follow the white path as accurately as you can.", 0, 0);
    }
}
function drawCursor(state) { // state: true/false = inPath/outOfPath
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
    ellipse(dotX*scaling, -dotY*scaling, 20, 20);
    noFill();
}
function drawTrace(state) { // draw trace behind triangle, state: true/false = inPath/outOfPath
    var baseColor;
    if(state)
        baseColor = color('blue');
    else
        baseColor = color('red');
    if(movin<1)
        strokeWeight(8);
    else
        strokeWeight(4);
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
        textAlign(CENTER,CENTER);
        text(`To measure your touchpad sensitivity, we need you to: \nPress space and move your finger from bottom to the top of the touchpad.\n\nPress space on your keyboard to begin calibration...`, 0, 0);
        return;
    } else if(mode == 3) {
        stroke('lightgray');
        fill('lightgray');
        textSize(Math.floor(10*scaling));
        strokeWeight(1);
        textAlign(CENTER,CENTER);
        text(`Move your finger upward from bottom to top of touchpad.\n\nPress space again when you are done moving.\nPress r to go back or restart calibration.`, 0, 0);
        return;
    }
    if(movin==0) {
        var coverHeight = maxY;
        if(delay<0) {
            stroke('lightgray');
            fill('lightgray');
            //rect(-maxX*scaling, -coverHeight*scaling, maxX*scaling*2, coverHeight*0.6*scaling);
            rect((lines[startVertex].x-10)*scaling, (lines[startVertex].y-10)*scaling, 20*scaling, 20*scaling);
            ellipse(dotX*scaling, -dotY*scaling, 20, 20);
            //stroke('blue');
            //line(maxX*scaling,dotY*scaling,maxX*scaling,0);
            //line(-maxX*scaling,dotY*scaling,-maxX*scaling,0);
        } else {
            stroke('blue');
            fill('blue');
            rect((lines[startVertex].x-10)*scaling, (lines[startVertex].y-10)*scaling, 20*scaling, 20*scaling);
            ellipse(dotX*scaling, -dotY*scaling, 20, 20);
        }
        if(frameNum > 600) {
            stroke('lightgray');
            fill('lightgray');
            textSize(Math.floor(10*scaling));
            strokeWeight(1);
            textAlign(CENTER,CENTER);
            text("Move the dot into the box.", 0, 0);
        }
    } else {
        if(blanknum<1) {
            stroke('lightgray');
            fill('lightgray');
            strokeWeight(1);
            textAlign(CENTER,CENTER);
            textSize(Math.floor(10*scaling));
            text(`Move the dot into the box.\nThen, draw the star as fast and as accurately as you can.`, 0, 0);
        } else {
            drawStar(offset==0);
            drawTrace(offset==0);
            if(giveFeedback > 0) {
                strokeWeight(1);
                textAlign(CENTER,CENTER);
                textSize(Math.floor(10*scaling));
                 //let msg = ["Be More Accurate!","Be More Accurate!","Nice!","Nice!","Good!","Very Good!"];
                 let colors_list = ["orange","lightgray","lightgray","green"];
                 var choice;
                 if(feedback_rk < 0) choice = 1;
                 else choice = feedback_rk;
                 stroke(colors_list[choice]);
                 fill(colors_list[choice]);
                 let percentage = score_max;
                 text(`\nYour Score: ${percentage}`, 0, 0);
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
            var scaledMovementX = e.movementX/speed_scale;
            var scaledMovementY = e.movementY/speed_scale;
            dotA += scaledMovementX;
            dotB -= scaledMovementY;
        }
    } else {
        //dotX = fixBetween(dotX+e.movementX/speed_scale,-maxX,maxX);
        dotY = fixBetween(dotY-e.movementY/speed_scale,-maxY,maxY);
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
            speed_scale = dotB/200;
            console.log(speed_scale);
            document.getElementById("container-exp").onmousemove = handleMouseMove;
            document.onkeyup = null;
            mode = -1;
            dotB = 0;
            dotY = -300.0;
            movin = -60; // -1
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
    if(!values[0].value) {
        alert('The id cannot be empty!');
        return;
    }
    id = values[0].value;
    
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x*0.8;
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
    let sy = windowHeight/width_x*0.8;
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