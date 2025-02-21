let ver = 0.40;
let cnv;
let dpi = -1;
let currentTrainBlock = 0;
//let trainBlocks = [6, 4, 4, 4, 4, -3, 4, 4, 7, 5, 5, -3, 5, 5, 5, 5];
let trainBlocks = [4,5];
/*
-n: n-minutes break
0: no path normal familiarization block
4: normal training block
5: reverse training block
6: normal testing block
7: reverse testing block
*/
let totalTrainBlocks;
//let amplitudes = [[1/2,1/4,1/16,1/8,-1/16,-1/32,1/64,1/32],[0,1/4,1/16,1/8,-1/16,-1/32,1/64,1/32]];
//let frequency = [[1/24,1/6,2/6,3/6,5/6,7/6,8/6,12/6],[1/24,1/6,2/6,3/6,5/6,7/6,8/6,12/6]];
let amplitudes = [[1/2,1/4,1/16,1/8,-1/16],[0,1/4,1/16,1/8,-1/16]];
let frequency = [[1/24,1/6,2/6,3/6,5/6],[1/24,1/6,2/6,3/6,5/6]];
let frameNum = 0; // Number of frames in the current session
var dotX;
var dotY;
//var dotV = [1.0, 1.0];
var dotA;
var yaw;
var til;
var maxY;
var width_x = 240;
var scaling_base;
var scaling;
var angleV2;
var lines;
var pathEdges;
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
var pathWidth = 50;
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
var famTargets;
var famTargetState;
var famTargetNext;
var famTargetInterval = 180;
var famScore;
var freeze;
var freeze_time = 200;
var freeze_margin;
var alph;
var beta = 0.1;
var gamm = 0.001;
var v_scale;
var b_val;
var tilt_mode;
var keyState;
var freeze_mode;
var action_mode;
var actGain;

var A_mat;
var B_mat;

// 2*mass
//const A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.15621111,-0.54357766,0.99077902,-0.03025695],[0.21999441,-0.39504269,0.34793208,0.64038676]];
//const B_mat = [[0,0,],[0,0],[0.00015281,-0.00180728],[-0.00180728,0.06819338]];

// .5*mass
//const A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.15829999,-0.54618288,0.98695242,-0.0375896],[0.18299894,-0.844848,0.38108019,0.72382222]];
//const B_mat = [[0,0,],[0,0],[0.00055419,-0.00255728],[-0.00255728,0.07469029]];

// decoupled
//const A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.13860977,0.0,0.98796909,0.0],[0.0,-0.96991869,0.0,0.69334504]];
//const B_mat = [[0,0,],[0,0],[0.00049015,0.0],[0.0,0.07243802]];

//const A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.15816291,-0.54424403,0.98944776,-0.03305154],[0.19532461,-0.66788316,0.36768052,0.69151345]];
//const B_mat = [[0,0,],[0,0],[0.01593498,-0.12409203],[-0.12409203,4.32384018]];
//const A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.15816291,-0.06893857,0.99648259,-0.01101718],[0.19532461,0.38369822,0.12256017,0.89717115]]; // 2
//const A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.15816291,-0.14320505,0.99472388,-0.01652577],[0.19532461,0.21938863,0.18384026,0.84575672]]; // 3
//const A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.15816291,-0.24717812,0.99296517,-0.02203436],[0.19532461,-0.0106448,0.2451203,0.7943423]]; // 4
var angle;
var dotAng;
var rolTorque;
var yawGain;
var rolGain;
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
    } else if(blockType<2) {
        sessionsType = [blockType];
    } else {
        let type = blockType%4;
        if(type < 2) {
            if(type == 0) {
                sessionsType = [6, 4];
            } else if(type == 1) {
                sessionsType = [7, 5, 4];
            }
        } else {
            if(type == 2) {
                sessionsType = [4];
            } else {
                sessionsType = [5];
            }
        }
    }
    sessions = sessionsType.length;
    currentSession = 0;
    //sessionInfo();
    //plot.hide();
    //select('#endDiv').hide();
    offset = sessionsType[currentSession]%2;
    startSession();
}
function sessionNext() {
    //isdraw = false;
    document.getElementById("container-exp").onmousemove = null;
    document.onkeydown = null;
    document.onkeyup = null;
    document.exitPointerLock();
    noLoop();
    clear();
    currentSession++;
    sessionComplete++;
    sessionInfo();
}
function startSession() {
    dotY = 0;
    dotA = 0;
    angleV2 = 0;
    dotU = 0;
    yaw = 0;
    til = 0;
    dotR = 0;
    angle = [0,0,0,0];
    //maxY = width_x*0.625; //150
    isDraw = true;
    select('#container-exp').show();
    if(tilt_mode == 2) {
        document.getElementById("container-exp").onmousemove = handleMouseMove1;
        keyState = {};
        document.onkeydown = handleTiltKeyDown;
        document.onkeyup = handleTiltKeyUp;
    } else {
        keyState = {};
        document.onkeydown = handleTiltKeyDown;
        document.onkeyup = handleTiltKeyUp;
    }
    document.getElementById("container-exp").requestPointerLock();
    dis = []; 
    ang = [];
    act = [];
    vDist = [];
    nse = [];
    q = [[],[],[],[]];
    maxPoints = 0;
    if(sessionsType[currentSession] < 2) { // empty session
        isTest = false;
        maxPoints = 7200;
        blanknum = 0;
        maxY = width_x*0.625; //150
        maxX = maxY;
        scaling = scaling_base;
        blank = [1];
        lines = null;
        perturbation = -1;
        perturbDir = null;
        perturbCoord = null;
        dotX = 0;
        randTargets(maxPoints/famTargetInterval);
        famTargetNext = 0
        famScore = 0;
    }
    else {
        isTest = sessionsType[currentSession]%4 < 2;
        if(isTest) {
            maxPoints = 600;
            blanknum = 0;
            maxY = width_x*0.625; //150
            maxX = maxY;
            scaling = scaling_base;
            if(highscore[offset]<0) // don't shuffle for the first test
                blank = [1/30,1/15,0.1,2/15,0.2,1/3,0.5,112/150,1]; // 9 sub-sessions
            else
                blank = shuffle([1/30,1/15,0.1,2/15,0.2,1/3,0.5,112/150,1]);
        } else {
            maxPoints = 600;
            blanknum = 0;
            maxY = width_x*0.625; //150
            maxX = maxY;
            scaling = scaling_base;
            blank = [1]; // num of sub-sessions
        }
        if(sessionsType[currentSession]>3) {
            //lines = sinuousCurve(maxPoints, isTest);
            lines = generatePath(maxPoints, isTest);
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
        dotX = lines[0].x;
        dotY = lines[0].y
    }
    clear();
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
    freeze = 0;
    freeze_margin = 0;
    loop();
}
function sessionInfo() {
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    let plot = select('#plot');
    var mse;
    htmlDiv.show();
    if(lines!=null && currentSession > 0) { // handles data
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
            q1: q[0],
            q2: q[1],
            q3: q[2],
            q4: q[3],
            per: perturbDir,
            num: sessionComplete,
            type: sessionsType[currentSession-1],
            hori: blank,
            offs: pOffsets,
            id: null,
            fps: fps/dis.length,
            version: ver,
            scale: scaling
        }
        console.log(blockData)
        //recordTrialSession(trialcollection, blockData);
        //subject.progress++;
        if(sessionComplete<4&&avgfps<50) { // Screen out participants
            forceQuit(1);
        }
        if(isTrain) {
            // Define Data for plotting
            const idx = Array.from(Array((maxPoints+straightLen)*(blank.length)).keys());
            //let u1 = act.map(function(value,index) { return value[0]; });
            //let u2 = act.map(function(value,index) { return value[1]; });
            let data = [
                {x: idx, y: lines, type: 'scatter', mode: 'lines', line: {color: 'black', width: 1}, name: 'Path'},
                {x: vDist, y: dis, type: 'scatter', mode: 'lines', line: {color: 'blue', width: 1}, name: 'You'},
                //{x: Array.from(Array(act.length).keys()), y: act, xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {color: 'black', width: 3}, name: 'Actions'},
                {x: idx, y: q[0], xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'tilt'},
                {x: idx, y: q[1], xaxis: 'x3', yaxis: 'y3', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'turn'},
                {x: idx, y: q[2], xaxis: 'x5', yaxis: 'y5', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'dot tilt'},
                {x: idx, y: q[3], xaxis: 'x6', yaxis: 'y6', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'dot turn'},
                {x: vDist, y: ang, xaxis: 'x4', yaxis: 'y4', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'heading'},
                {x: idx, y: act, xaxis: 'x8', yaxis: 'y8', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'act tilt'},
                //{x: idx, y: u1, xaxis: 'x8', yaxis: 'y8', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'act tilt'},
                //{x: idx, y: u2, xaxis: 'x9', yaxis: 'y9', type: 'scatter', mode: 'lines', line: {width: 1}, name: 'act turn'}
            ];
            // layout
            var layout = {
                title: 'States (position & heading/tilt/handlebar angle)',
                yaxis: {rangemode: "tozero"},
                grid: {rows: 3, columns: 3, pattern: 'independent'},
            };
            // Display using Plotly
            plot.show();
            plot.html("");
            Plotly.newPlot("plot", data, layout, {responsive: true});
        } else {
            /*let msg;
            let color = offset==0? "blue":"red";
            if(highscore[offset]<0) {
                highscore[offset] = mse;
                //msg = `<br><br>Best performance error: ${highscore[offset].toFixed()}`;
                msg = `<br><br>Best performance error: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            } 
            else if(mse<highscore[offset]) {
                highscore[offset] = mse;
                //msg = `<br><br>Congratulations! Your score improved better! Keep it up!<br><br>Best performance error: ${highscore[offset].toFixed()}`;
                msg = `<br><br>Congratulations! Your score improved better! Keep it up!<br><br>Best performance error: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            } else {
                //msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance error: ${highscore[offset].toFixed()}`;
                msg = `<br><br>Your score was worse this time! Try to beat your score!<br><br>Best performance error: <span style="color:${color};">${highscore[offset].toFixed()}</span>`;
            }
            plot.show();
            plot.html(msg);*/
        }
    } else {
        mse = -1.0;
        plot.hide();
    }
    mse = mse.toFixed();
    select('#container-exp').hide()
    /*let button = document.getElementById("startBt");
    timer = setTimeout(()=>{select('#endInstr-span').html("Are you still there? Please click the button now or the experiment will terminate.");document.getElementById("endInstr-span").style.color = "red";
                            timer = setTimeout(()=>{forceQuit(2);},60000);},60000);
    if(currentSession < sessions) { // proceed to next session
        offset = sessionsType[currentSession]%2;
        testTrain = sessionsType[currentSession]%4 > 1? 1: 0;
        let color = offset==0? "blue":"red";
        let desc;
        if(sessionsType[currentSession] == 0)
            desc = `<span style="color:${color};">First, please take some time to familiarize yourself with the controls.</span><br>`
        else if(testTrain==0) {
            if(highscore[offset]<0) {
                desc = offset==0? `<span style="color:${color};">Test: try to follow the black path as closely as posible</span><br>` : `Now we will introduce the <span style=\"color:red;\">Red Fish!</span><br>The Red fish may not behave in an intuitive way at first. But if you keep on trying to follow the grey path, you will see that your performance will improve.`;
            } else
                desc = `<span style="color:${color};">Test: now it is time to see if you have improved!</span><br>`;
        }
        else
            desc = `<span style="color:${color};">Train: time to learn how to do the task!</span><br>`;
        if(mse < 0)
            instr.html(`<br>${desc}</br>Current Progress: ${int(sessionComplete/sessionTotal*100)}%<br><br><span id="endInstr-span">Click the Continue button to proceed.</span>`);
        else
            instr.html(`<br>${desc}</br>Current Progress: ${int(sessionComplete/sessionTotal*100)}%<br>Average Error: ${mse}<br><span id="endInstr-span">Click the Continue button to proceed.</span>`);
        butfunc = ()=>{plot.hide();select('#endDiv').hide();startSession();};
    } else { // end of a block
        if(currentTrainBlock+1 < totalTrainBlocks){ // proceed to next block
            if(mse < 0)
                instr.html(`<br>Current Progress: ${int(sessionComplete/sessionTotal*100)}%<br><br><br><span id="endInstr-span">Click the Continue button to proceed to next training block.</span>`);
            else
                instr.html(`<br>Current Progress: ${int(sessionComplete/sessionTotal*100)}%<br>Average Error: ${mse}<br><br><span id="endInstr-span">Click the Continue button to proceed to next training block.</span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; trainBlockStart();};
        } else { // Final block, end game
            instr.html(`<br>Current Progress: ${int(sessionComplete/sessionTotal*100)}%<br>Average Error: ${mse}<br><br><span id="endInstr-span">Click the Continue button to proceed.</span>`);
            butfunc = ()=>{plot.hide();select('#endDiv').hide(); currentTrainBlock++; endGame();};
        }
    }
    button.onclick = ()=>{clearTimeout(timer);butfunc();};*/
}
function draw() {
    if(isDraw) {
        if(-dotY >= plen*(blanknum+1)) {
            if(blanknum < blank.length-1) { // next sub-session
                blanknum++;
                dotX = lines[-dotY];
                dotA = 0.0;
                angleV2 = 0.0;
                yaw = 0.0;
                til = 0.0;
                dotR = 0;
                angle = [0,0,0,0];
                movin=false;
            } else {
                //console.log("draw end: "+isDraw)
                isDraw = false;
                sessionNext();
                return;
            }
        } else if(!movin && -dotY>=plen*blanknum+straightLen*0.75) // enable controls after a short freeze at the beginning
            movin=true;
        if(freeze<1) {
            //var noise = moveNoise(sessionsType[currentSession]);
            var noise = 0;
            // record trajectory
            dis.push(dotX);
            vDist.push(-dotY);
            ang.push(dotA);
            act.push(dotU);
            nse.push(noise);
            q[0].push(angle[0]);
            q[1].push(angle[1]);
            q[2].push(angle[2]);
            q[3].push(angle[3]);
            if(lines==null) {
                if(movin) {
                    inactivity++;
                    let nextTarget =  famTargets[famTargetNext]; // nextTarget[x-coord, y-coords]
                    if(nextTarget != null) {
                        if(-dotY >nextTarget[1]+10)
                            famTargetNext += 1;
                        else if(famTargetState[famTargetNext] == 0 && -dotY > nextTarget[1]-10 && Math.abs(dotX-nextTarget[0])<10) {
                            famTargetState[famTargetNext] = 1;
                            famScore += 1;
                        
                        }
                    }
                }
            } else {
                //var pathError = linearError();
                var pathError = distToPath();
                /*if(pathError > pathWidth*pathWidth) {
                    dotX = lines[-dotY];
                    freeze = freeze_time;
                    freeze_margin = 0;
                    freeze_mode = 1;
                }*/
            }
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
            dotX += b_val[offset][0]*Math.sin(dotA);
            dotY -= Math.cos(dotA);
            var v;
            if(v_scale)
                v = Math.sqrt(Math.tan(dotA)**2+1);
            else
                v = 1;
            /*if(dotX < -maxX*0.9) { // hits edge
                freeze_margin += 1;
                if(lines!=null&&freeze_margin>60) {
                    dotX = (dotX+lines[-dotY])/2.0;
                    freeze = freeze_time;
                    freeze_margin = 0;
                    freeze_mode = 1;
                }
                if(dotX < -maxX) {
                    dotX = -maxX;
                    dotA = 0;
                }
            } else if(dotX > maxX*0.9) {
                freeze_margin += 1;
                if(lines!=null&&freeze_margin>60) {
                    dotX = (dotX+lines[-dotY])/2.0;
                    freeze = freeze_time;
                    freeze_margin = 0;
                    freeze_mode = 1;
                }
                if(dotX > maxX) {
                    dotX = maxX;
                    dotA = 0;
                }
            } else if(freeze_margin > 0)
                freeze_margin -= 1;*/
            
            if(action_mode == 0) {
                if(tilt_mode > 2) {
                    angleV2 = 0;
                    if(keyState['z'])
                        angleV2 += -1;
                    if(tilt_mode == 3) {
                        if(keyState['x'])
                            angleV2 += 1;
                    } else {
                        if(keyState['.'])
                            angleV2 += 1;
                    }
                }
                
                dotU = fixBetween(b_val[offset][1]*angleV2, -1, 1)*rolTorque;
                angleV2 = 0;
            } else {
                if(tilt_mode > 2) {
                    if(keyState['z'])
                        angleV2 += -actGain;
                    if(tilt_mode == 3) {
                        if(keyState['x'])
                            angleV2 += actGain;
                    } else {
                        if(keyState['.'])
                            angleV2 += actGain;
                    }
                }
                angleV2 = fixBetween(angleV2, -1, 1);
                dotU = b_val[offset][1]*angleV2*rolTorque;
            }
            
            /*dotAng = math.multiply(M_mat, (math.subtract(dotU, math.multiply(C_mat,angle))));

            angle[0] += angle[2]/60;
            angle[1] += angle[3]/60;
            angle[2] += dotAng[0]/60// + dotU[0];
            angle[3] += dotAng[1]/60// + dotU[1];
            //dotA += angle[1]/60;*/
            
            angle = math.add(math.multiply(A_mat,angle),math.multiply(B_mat,[dotU,0]));
            //angle[1] =0; // disable roll
            dotA += (6*angle[1]+0.08*angle[3])*0.0155401391551;
            /*if(dotA < -maxA) {
                dotA = -maxA;
                //angle[1] = 0;
                //angle[3] = Math.max(0, angle[3]);
            } else if(dotA > maxA) {
                dotA = maxA;
                //angle[1] = 0;
                //angle[3] = Math.min(0, angle[3]);
            }*/ if(angle[0] < -maxA) {
                angle[0] = -maxA;
                freeze = freeze_time;
                freeze_mode = 2;
            } else if(angle[0] > maxA) {
                angle[0] = maxA;
                freeze = freeze_time;
                freeze_mode = 2;
            }
            
            angle[1] = fixBetween(angle[1],-maxA/2,maxA/2);
            angle[2] = fixBetween(angle[2],-maxA,maxA);
            angle[3] = fixBetween(angle[3],-maxA/2,maxA/2);
            
            /*if(angle[0] < -maxA*0.9) { // falls over
                freeze_margin += 2;
                if(lines!=null&&freeze_margin>60) {
                    dotX = (dotX+lines[-dotY])/2.0;
                    freeze = freeze_time;
                    freeze_margin = 0;
                }
                if(angle[0] < -maxA) {
                    angle[0] = -maxA;
                    angle[2] = 0;
                }
            } else if(angle[0] > maxA*0.9) {
                freeze_margin += 2;
                if(lines!=null&&freeze_margin>60) {
                    dotX = (dotX+lines[-dotY])/2.0;
                    freeze = freeze_time;
                    freeze_margin = 0;
                }
                if(angle[0] > maxA) {
                    angle[0] = maxA;
                    angle[2] = 0;
                }
            } else if(freeze_margin > 0)
                freeze_margin -= 1;*/
            
            if(movin)
                error += pathError;
        } else {
            freeze -= 1;
            if(freeze == 0)
                resetAndUnfreeze();
        }
        // draw
        clear();
        background('white');
        stroke('black');
        strokeWeight(4);
        noFill();
        //let high = int(maxY*blank[blanknum]-dotY);
        translate(windowWidth/2 - dotX*scaling, windowHeight/2 - dotY*scaling);
        //rect(-maxX*scaling, -(maxY-dotY)*scaling, maxX*scaling*2, maxY*scaling*1.5);
        //drawCurve(lines, -dotY-1-pathWidth, min(high+pathWidth,(blanknum+1)*plen));
        drawCurve();
        //drawBike();
        drawBox();
        drawTrace();
        // save framerate
        fr = frameRate();
        if(frameNum%10==0)
            frBuffer = fr.toFixed();
        stroke('black');
        fill('black');
        textSize(12);
        strokeWeight(1);
        text("FPS: "+frBuffer, maxY*scaling-50, -(maxY-dotY)*scaling+10);
        text("ϕ δ: "+angle[0].toFixed(2)+" "+angle[1].toFixed(2), maxY*scaling-100, -(maxY-dotY)*scaling+20); // debug
        text("dq : "+angle[2].toFixed(2)+" "+angle[3].toFixed(2), maxY*scaling-100, -(maxY-dotY)*scaling+30);
        text("u  : "+dotU.toFixed(2)+" 0.0", maxY*scaling-100, -(maxY-dotY)*scaling+50);
        text("x ψ: "+dotX.toFixed(2)+" "+dotA.toFixed(2), maxY*scaling-100, -(maxY-dotY)*scaling+60);
        if(freeze<1) { 
            fps += fr;
            frameNum++;
        } else {
            let msg = ["","Drift","Fall"];
            stroke('red');
            fill('red');
            textSize(30);
            text(msg[freeze_mode], 0, -(maxY/2-dotY)*scaling);
        }
    }
}
function resetAndUnfreeze() {
    //dotX = (dotX+lines[-dotY])/2.0;
    //dotA = 0;
    angleV2 = 0;
    dotU = 0;
    yaw = 0;
    til = 0;
    dotR = 0;
    angle = [0,0,0,0];
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
        let dist = distToSegmentSquared({x: dotX, y: -dotY}, {x: lines[i-1].x, y: lines[i-1].y}, {x: lines[i].x, y:lines[i].y});
        if(dist < minDist)
            minDist = dist;
    }
    return minDist;
}
function linearError() { // horizontal distance to trajectory
    if(dotY>0 || -dotY>=lines.length)
        return 0;
    return Math.abs(dotX-lines[-dotY]);
}
function sinuousCurve(len, isTest) { // generate trajectory
    let start = 0;
    var ampl;
    var freq;
    var repeat;
    if(isTest) {
        ampl = amplitudes[1];
        freq = frequency[1];
        repeat = blank.length;
    } else {
        ampl = amplitudes[0];
        freq = frequency[0];
        repeat = blank.length;
    }
    var points = [];
    var lPath = [];
    var rPath = [];
    for(let i=0; i<len; i++) {
        var X = 0;
        var X2 = 0;
        for(let j=0; j<ampl.length; j++) {
            X += width_x/2*ampl[j]*sin(2*PI*start*freq[j]);
            X2 += 2*PI*freq[j]*0.01*width_x/2*ampl[j]*cos(2*PI*start*freq[j]);
        }
        points.push(X);
        let n = sqrt(X2**2 + 1); // normalizing constant
        lPath.push({x: -1*pathWidth/n + X, y: X2*pathWidth/n});
        rPath.push({x: 1*pathWidth/n + X, y: -X2*pathWidth/n});
        start += 0.01;
    }
    var paths = [];
    pathEdges = [];
    pOffsets = {startpos:[]};
    for(let i=0; i<repeat; i++) { // generate each sub-trajectory
        let offset = int(random()*points.length);
        pOffsets.startpos.push(offset);
        var path = arrayRotate(points.slice(0), offset); // randomize starting position for each sub-trajectory
        var lp = arrayRotate(lPath.slice(0), offset);
        var rp = arrayRotate(rPath.slice(0), offset);
        paths = paths.concat(Array(straightLen).fill(path[0]).concat(path));
        //let straightLen1 = Math.floor(straightLen - lp[0].y);
        /*let lp0 = []
        let rp0 = []
        for(let j=0; j<straightLen; j++) {
            lp0.push({x: path[0]-pathWidth, y: j});
            rp0.push({x: path[0]+pathWidth, y: j});
        }
        pathEdges.push(lp0.concat(lp));
        pathEdges.push(rp0.concat(rp));*/
        pathEdges.push(Array(straightLen).fill({x: path[0]-pathWidth, y: 0}).concat(lp));
        pathEdges.push(Array(straightLen).fill({x: path[0]+pathWidth, y: 0}).concat(rp));
    }
    return paths;
}
function generatePath(len, isTest) { // generate trajectory
    let start = 0;
    var ampl;
    var freq;
    var repeat;
    if(isTest) {
        ampl = amplitudes[1];
        freq = frequency[1];
        repeat = blank.length;
    } else {
        ampl = amplitudes[0];
        freq = frequency[0];
        repeat = blank.length;
    }
    var points = [];
    var lPath = [];
    var rPath = [];
    for(let i=0; i<len; i++) {
        var X = 0;
        var Y = 0;
        var X2 = 0;
        var Y2 = 0;
        /*for(let j=0; j<ampl.length; j++) {
            X += width_x/2*ampl[j]*sin(2*PI*start*freq[j]);
            X2 += 2*PI*freq[j]*0.01*width_x/2*ampl[j]*cos(2*PI*start*freq[j]);
        }*/
        X = width_x/2*sin(2*PI*start);
        X2 = 2*PI*1/len*width_x/2*cos(2*PI*start);
        Y = width_x/2*cos(2*PI*start);
        Y2 = -2*PI*1/len*width_x/2*sin(2*PI*start);
        
        points.push({x: X, y: Y});
        let n = sqrt(X2**2 + Y2**2); // normalizing constant
        lPath.push({x: -Y2*pathWidth/n + X, y: X2*pathWidth/n + Y});
        rPath.push({x: Y2*pathWidth/n + X, y: -X2*pathWidth/n + Y});
        start += 1/len; // 0.01
    }
    var paths = [];
    pathEdges = [];
    pOffsets = {startpos:[]};
    for(let i=0; i<repeat; i++) { // generate each sub-trajectory
        let offset = int(random()*points.length);
        pOffsets.startpos.push(offset);
        var path = arrayRotate(points.slice(0), offset); // randomize starting position for each sub-trajectory
        var lp = arrayRotate(lPath.slice(0), offset);
        var rp = arrayRotate(rPath.slice(0), offset);
        //paths = paths.concat(Array(straightLen).fill(path[0]).concat(path));
        //pathEdges.push(Array(straightLen).fill({x: path[0]-pathWidth, y: 0}).concat(lp));
        //pathEdges.push(Array(straightLen).fill({x: path[0]+pathWidth, y: 0}).concat(rp));
        paths = path;
        pathEdges.push(lp);
        pathEdges.push(rp);
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
function drawCurve0(coords, start, end) {
    if(coords!==null) {
        noFill();
        let startFix = Math.floor(start);
        if(startFix < 0)
            startFix = 0;
        let endFix = Math.ceil(end);
        if(endFix > coords.length)
            endFix = coords.length;
        stroke('grey');
        strokeWeight(6);
        for(let i = startFix+1; i<endFix; i++)
            line(coords[i-1].x*scaling, (1-coords[i-1].y)*scaling, coords[i].x*scaling, (-coords[i].y)*scaling);
        stroke('lightgrey');
        strokeWeight(4);
        for(let i = startFix+1; i<endFix; i++) {
            for(let j of pathEdges) {
                line(j[i-1].x*scaling, (1-j[i-1].y)*scaling, j[i].x*scaling, (-j[i].y)*scaling);
            }
            //let j = path[0];
            //line(j[i-1].x*scaling*scaling_x, -j[i-1].y*scaling*scaling_y, j[i].x*scaling*scaling_x, -j[i].y*scaling*scaling_y);
        }
        noStroke();
        fill('lightgray')
        rect(-maxX*scaling+2, (maxY/2+dotY)*scaling, 2*maxX*scaling-4, (2-maxY/2)*scaling);
        if(blank[blanknum]<0.9) {
            fill('grey');
            rect(-maxX*scaling+2, (dotY-maxY)*scaling, 2*maxX*scaling-4, maxY*(1-blank[blanknum])*scaling);
        }
    } else {
        for(let i=0;i<famTargets.length;i++) {
            if(famTargetState[i]==1) {
                stroke('blue');
                fill('blue');
            }
            else {
                stroke('grey');
                fill('grey');
            }
            //ellipse(famTargets[i][0]*scaling, -famTargets[i][1]*scaling, 10*scaling, 10*scaling);
            rect((famTargets[i][0]-10)*scaling, -(famTargets[i][1]+10)*scaling, 20*scaling, 20*scaling);
        }
        stroke('black');
        fill('black');
        textSize(24);
        strokeWeight(1);
        textAlign(CENTER);
        var remain = Math.floor((plen*(blank.length)+dotY)/60);
        text("Move the cursor left or right to swing the tail.\nThe the more curled up the tail, the faster the fish will turn.\nThe fish will stop turning when the tail is straight.\nTry to touch the falling gray boxes. Score: "+famScore+" / "+famTargets.length+"\n"+
                "\nRemaining time: "+String(remain).padStart(2,'0'), 0, -(maxY*2/3-dotY)*scaling);
        
    }
}
function drawCurve() {
    if(lines!==null) {
        //let high = int(maxY*blank[blanknum]-dotY);
        //translate(windowWidth/2, windowHeight*2/3 - dotY*scaling);
        //rect(-maxX*scaling, -(maxY-dotY)*scaling, maxX*scaling*2, maxY*scaling*1.5);
        //drawCurve(lines, -dotY-1-pathWidth, min(high+pathWidth,(blanknum+1)*plen));
        let leftEdge = dotX - maxX;
        let rigtEdge = dotX + maxX;
        let topEdge = -dotY - maxY;
        let botEdge = -dotY + maxY;
        let onScreen = (a) => a.x>leftEdge && a.x<rigtEdge && a.y>topEdge && a.y<botEdge;
        noFill();
        stroke('grey');
        strokeWeight(6);
        for(let i = 1; i<lines.length; i++)
            if(onScreen(lines[i-1]) || onScreen(lines[i]))
                line(lines[i-1].x*scaling, (1-lines[i-1].y)*scaling, lines[i].x*scaling, (-lines[i].y)*scaling);
        stroke('lightgrey');
        strokeWeight(4);
        for(let i = 1; i<lines.length; i++) {
            for(let j of pathEdges) {
                if(onScreen(j[i-1]) || onScreen(j[i]))
                    line(j[i-1].x*scaling, (1-j[i-1].y)*scaling, j[i].x*scaling, (-j[i].y)*scaling);
            }
            //let j = path[0];
            //line(j[i-1].x*scaling*scaling_x, -j[i-1].y*scaling*scaling_y, j[i].x*scaling*scaling_x, -j[i].y*scaling*scaling_y);
        }
        /*noStroke();
        fill('lightgray')
        rect(-maxX*scaling+2, (maxY/2+dotY)*scaling, 2*maxX*scaling-4, (2-maxY/2)*scaling);
        if(blank[blanknum]<0.9) {
            fill('grey');
            rect(-maxX*scaling+2, (dotY-maxY)*scaling, 2*maxX*scaling-4, maxY*(1-blank[blanknum])*scaling);
        }*/
    } else {
        for(let i=0;i<famTargets.length;i++) {
            if(famTargetState[i]==1) {
                stroke('blue');
                fill('blue');
            }
            else {
                stroke('grey');
                fill('grey');
            }
            //ellipse(famTargets[i][0]*scaling, -famTargets[i][1]*scaling, 10*scaling, 10*scaling);
            rect((famTargets[i][0]-10)*scaling, -(famTargets[i][1]+10)*scaling, 20*scaling, 20*scaling);
        }
        stroke('black');
        fill('black');
        textSize(24);
        strokeWeight(1);
        textAlign(CENTER);
        var remain = Math.floor((plen*(blank.length)+dotY)/60);
        text("Move the cursor left or right to swing the tail.\nThe the more curled up the tail, the faster the fish will turn.\nThe fish will stop turning when the tail is straight.\nTry to touch the falling gray boxes. Score: "+famScore+" / "+famTargets.length+"\n"+
                "\nRemaining time: "+String(remain).padStart(2,'0'), 0, -(maxY*2/3-dotY)*scaling);
        
    }
}
function drawBox0() {
    let x_len = 20;
    let y_len = 60;
    let z_len = 40;
    let x_dis = dotX*scaling;
    let y_dis = dotY*scaling;
    let x_rot = 0;
    let y_rot = -angle[0];
    let z_rot = dotA;
    let rot = math.matrix([[cos(y_rot)*cos(z_rot), sin(x_rot)*sin(y_rot)*cos(z_rot)-cos(x_rot)*sin(z_rot), cos(x_rot)*sin(y_rot)*cos(z_rot)+sin(x_rot)*sin(z_rot)], 
                            [cos(y_rot)*sin(z_rot), sin(x_rot)*sin(y_rot)*sin(z_rot)+cos(x_rot)*cos(z_rot), cos(x_rot)*sin(y_rot)*sin(z_rot)-sin(x_rot)*cos(z_rot)], 
                            [-sin(y_rot), sin(x_rot)*cos(y_rot), cos(x_rot)*cos(y_rot)]]);
    // coordinate of vertices
    var v1 = math.matrix([x_len, y_len, -z_len]);
    var v2 = math.matrix([-x_len, y_len, -z_len]);
    var v3 = math.matrix([-x_len, -y_len, -z_len]);
    var v4 = math.matrix([x_len, -y_len, -z_len]);
    var v5 = math.matrix([0, y_len, z_len]);
    var v6 = math.matrix([0, -y_len, z_len]);
    // coordinates of vertices from origin
    var v1r = math.multiply(rot, v1)._data;
    var v2r = math.multiply(rot, v2)._data;
    var v3r = math.multiply(rot, v3)._data;
    var v4r = math.multiply(rot, v4)._data;
    var v5r = math.multiply(rot, v5)._data;
    var v6r = math.multiply(rot, v6)._data;
    // compute visible faces
    let cons = 2*(math.sqrt(2)+1)*40; // perspective constant
    let dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    let cull = (x) => Math.sign(-cons*dot(rot._data[2],x)-(dot(rot._data[0],x)**2+dot(rot._data[1],x)**2+dot(rot._data[2],x)**2));
    //let visible = [cull([1,0,0]),cull([0,1,0]),cull([0,0,1]),cull([-1,0,0]),cull([0,-1,0]),cull([0,0,-1])];
    let angle1 = Math.acos(x_len/2/z_len);
    let visible = [cull([x_len*sin(angle1),0,0.5*z_len*cos(angle1)]),cull([0,y_len,0]),cull([0,0,z_len]),cull([-x_len*sin(angle1),0,0.5*z_len*cos(angle1)]),cull([0,-y_len,0]),cull([0,0,-z_len])];
    // draw faces
    push();
    translate(x_dis, y_dis);
    strokeWeight(1);
    stroke('black');
    fill('blue');
    line(60*cos(angle[1]), 120+60*sin(angle[1]), -60*cos(angle[1]), 120-60*sin(angle[1])); // handle test
    fill(50, 55, 100);
    //if(visible[5] > 0) // top face
        //quad(v5r[0]*cons/(cons+v5r[2]),v5r[1]*cons/(cons+v5r[2]),v6r[0]*cons/(cons+v6r[2]),v6r[1]*cons/(cons+v6r[2]),v7r[0]*cons/(cons+v7r[2]),v7r[1]*cons/(cons+v7r[2]),v8r[0]*cons/(cons+v8r[2]),v8r[1]*cons/(cons+v8r[2]));
    if(visible[5] > 0) // top face
        quad(v1r[0]*cons/(cons+v1r[2]),v1r[1]*cons/(cons+v1r[2]),v2r[0]*cons/(cons+v2r[2]),v2r[1]*cons/(cons+v2r[2]),v3r[0]*cons/(cons+v3r[2]),v3r[1]*cons/(cons+v3r[2]),v4r[0]*cons/(cons+v4r[2]),v4r[1]*cons/(cons+v4r[2]));
    fill('blue');
    if(visible[0] > 0) // right face
        quad(v1r[0]*cons/(cons+v1r[2]),v1r[1]*cons/(cons+v1r[2]),v5r[0]*cons/(cons+v5r[2]),v5r[1]*cons/(cons+v5r[2]),v6r[0]*cons/(cons+v6r[2]),v6r[1]*cons/(cons+v6r[2]),v4r[0]*cons/(cons+v4r[2]),v4r[1]*cons/(cons+v4r[2]));
    if(visible[3] > 0) // left face
        quad(v2r[0]*cons/(cons+v2r[2]),v2r[1]*cons/(cons+v2r[2]),v3r[0]*cons/(cons+v3r[2]),v3r[1]*cons/(cons+v3r[2]),v6r[0]*cons/(cons+v6r[2]),v6r[1]*cons/(cons+v6r[2]),v5r[0]*cons/(cons+v5r[2]),v5r[1]*cons/(cons+v5r[2]));
    pop();
}
function drawBox() {
    let x_len = 5;
    let y_len = 30;
    let z_len = 20;
    let x_dis = dotX*scaling;
    let y_dis = dotY*scaling;
    let x_rot = 0;
    let y_rot = -angle[0];
    let z_rot = dotA;
    let rot = math.matrix([[cos(y_rot)*cos(z_rot), sin(x_rot)*sin(y_rot)*cos(z_rot)-cos(x_rot)*sin(z_rot), cos(x_rot)*sin(y_rot)*cos(z_rot)+sin(x_rot)*sin(z_rot)], 
                            [cos(y_rot)*sin(z_rot), sin(x_rot)*sin(y_rot)*sin(z_rot)+cos(x_rot)*cos(z_rot), cos(x_rot)*sin(y_rot)*sin(z_rot)-sin(x_rot)*cos(z_rot)], 
                            [-sin(y_rot), sin(x_rot)*cos(y_rot), cos(x_rot)*cos(y_rot)]]);
    // coordinate of vertices
    var v1 = math.matrix([x_len, y_len, z_len]);
    var v2 = math.matrix([-x_len, y_len, z_len]);
    var v3 = math.matrix([-x_len, -y_len, z_len]);
    var v4 = math.matrix([x_len, -y_len, z_len]);
    var v5 = math.matrix([x_len, y_len, -z_len]);
    var v6 = math.matrix([-x_len, y_len, -z_len]);
    var v7 = math.matrix([-x_len, -y_len, -z_len]);
    var v8 = math.matrix([x_len, -y_len, -z_len]);
    // coordinates of vertices from origin
    var v1r = math.multiply(rot, v1)._data;
    var v2r = math.multiply(rot, v2)._data;
    var v3r = math.multiply(rot, v3)._data;
    var v4r = math.multiply(rot, v4)._data;
    var v5r = math.multiply(rot, v5)._data;
    var v6r = math.multiply(rot, v6)._data;
    var v7r = math.multiply(rot, v7)._data;
    var v8r = math.multiply(rot, v8)._data;
    // compute visible faces
    let cons = 2*(math.sqrt(2)+1)*40; // perspective constant
    let dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    let cull = (x) => Math.sign(-cons*dot(rot._data[2],x)-(dot(rot._data[0],x)**2+dot(rot._data[1],x)**2+dot(rot._data[2],x)**2));
    let visible = [cull([x_len,0,0]),cull([0,y_len,0]),cull([0,0,z_len]),cull([-x_len,0,0]),cull([0,-y_len,0]),cull([0,0,-z_len])];
    // draw faces
    push();
    translate(x_dis, y_dis);
    stroke('black');
    // draw handlebar and front wheel
    var v9 = math.matrix([y_len*cos(angle[1]), y_len*sin(angle[1])-y_len, -z_len*0.75]);
    var v10 = math.matrix([-y_len*cos(angle[1]), -y_len*sin(angle[1])-y_len, -z_len*0.75]);
    var v9r = math.multiply(rot, v9)._data;
    var v10r = math.multiply(rot, v10)._data;
    line(v9r[0]*cons/(cons+v9r[2]),v9r[1]*cons/(cons+v9r[2]), v10r[0]*cons/(cons+v10r[2]),v10r[1]*cons/(cons+v10r[2]));
    
    if(action_mode == 1) {
        // draw roll/yaw slide bars
        line(-120,120,120,120);
        line(0, 110, 0, 130);
        strokeWeight(1);
        stroke('blue');
        fill('blue');
        ellipse(120*angleV2,120,20,20);
        stroke('black');
    } else
        strokeWeight(1);
    fill(50, 55, 100);
    if(visible[5] > 0) // top face
        quad(v5r[0]*cons/(cons+v5r[2]),v5r[1]*cons/(cons+v5r[2]),v6r[0]*cons/(cons+v6r[2]),v6r[1]*cons/(cons+v6r[2]),v7r[0]*cons/(cons+v7r[2]),v7r[1]*cons/(cons+v7r[2]),v8r[0]*cons/(cons+v8r[2]),v8r[1]*cons/(cons+v8r[2]));
    fill('blue');
    if(visible[0] > 0) // right face
        quad(v1r[0]*cons/(cons+v1r[2]),v1r[1]*cons/(cons+v1r[2]),v5r[0]*cons/(cons+v5r[2]),v5r[1]*cons/(cons+v5r[2]),v8r[0]*cons/(cons+v8r[2]),v8r[1]*cons/(cons+v8r[2]),v4r[0]*cons/(cons+v4r[2]),v4r[1]*cons/(cons+v4r[2]));
    if(visible[3] > 0) // left face
        quad(v2r[0]*cons/(cons+v2r[2]),v2r[1]*cons/(cons+v2r[2]),v3r[0]*cons/(cons+v3r[2]),v3r[1]*cons/(cons+v3r[2]),v7r[0]*cons/(cons+v7r[2]),v7r[1]*cons/(cons+v7r[2]),v6r[0]*cons/(cons+v6r[2]),v6r[1]*cons/(cons+v6r[2]));
    
    // draw arrows
    //line(0, 0, angle[2]*50, 0);
    //line(0, -60, angle[3]*50, -60);
    pop();

}
function drawBike() {
    if(!movin)
        var color = 'grey';
    else if(offset == 0)
        var color = 'blue';
    else
        var color = 'red';
    if(freeze>0) {
        if(freeze%40<21) {
            let heading = 0;
            let x = dotX*scaling;
            let y = dotY*scaling;
            let A = 0;
            let d = 0;
            stroke('grey');
            fill('grey');
            strokeWeight(3);
            triangle(x+15*sin(heading+A), y-15*cos(heading+A), x+6*cos(heading+A), y+6*sin(heading+A), x-6*cos(heading+A), y-6*sin(heading+A));
            noFill();
            curve(x+d*cos(heading),y+d*sin(heading), x, y, x-45*sin(heading), y+45*cos(heading), x-45*sin(heading)+d*cos(heading), y+45*cos(heading)+d*sin(heading));
        }
    } else {
        stroke(color);
        fill(color);
        strokeWeight(3);
        let heading = dotA;
        let x = dotX*scaling;
        let y = dotY*scaling;
        let A = angle[3]*20;
        let d = angle[3]*4800/PI;
        triangle(x+15*sin(heading+A), y-15*cos(heading+A), x+6*cos(heading+A), y+6*sin(heading+A), x-6*cos(heading+A), y-6*sin(heading+A));
        //triangle(x+15*sin(heading), y-15*cos(heading), x+6*cos(heading), y+6*sin(heading), x-6*cos(heading), y-6*sin(heading));
        noFill();
        curve(x+d*cos(heading),y+d*sin(heading), x, y, x-45*sin(heading), y+45*cos(heading), x-45*sin(heading)+d*cos(heading), y+45*cos(heading)+d*sin(heading));
        //line(x,y,x-45*sin(heading-A), y+45*cos(heading-A));
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
        ellipse(trace[i].x*scaling, trace[i].y*scaling, 2, 2);
        transparency += increment;
    }
}
function pause() { // pause due to inactivity
    document.exitPointerLock();
    noLoop();
    clear();
    //isdraw = false;
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    select('#container-exp').hide()
    document.getElementById("container-exp").onmousemove = null;
    document.onkeydown = null;
    document.onkeyup = null;
    let button = document.getElementById("startBt");
    instr.html(`<br>Are you still there?<br><br>The experiment has been paused because we cannot detect any cursor movement for a few seconds.<br><br><span id="endInstr-span">Click the Continue button to return to the experiment.</span>`);
    timer = setTimeout(()=>{select('#endInstr-span').html("Please click the button now or the experiment will terminate.");document.getElementById("endInstr-span").style.color = "red";
                            timer = setTimeout(()=>{forceQuit(2);},60000);},120000);
    butfunc = ()=>{select('#endDiv').hide();resume();};
    button.onclick = ()=>{clearTimeout(timer);butfunc();};
}
function resume() {
    isDraw = true;
    inactivity = 0;
    select('#container-exp').show();
    if(tilt_mode == 2) {
        document.getElementById("container-exp").onmousemove = handleMouseMove1;
        keyState = {};
        document.onkeydown = handleTiltKeyDown;
        document.onkeyup = handleTiltKeyUp;
    } else {
        keyState = {};
        document.onkeydown = handleTiltKeyDown;
        document.onkeyup = handleTiltKeyUp;
    }
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
        select('#endInstr').html(`<br>Let's take a ${-trainBlocks[currentTrainBlock]} minute break.<br>Please make sure to come back in ${-trainBlocks[currentTrainBlock]+graceTime/60} minutes or the experiment will terminate.
                                    <br>${Math.floor(timerCount/60)} : ${String(timerCount%60).padStart(2,'0')}`);
    } else if(timerCount == 0) {
        let btn = document.getElementById("startBt");
        select('#endInstr').html(`<br><br><br>Please click the button and proceed with the experiment.<br>`);
        btn.style.display = 'block';
        btn.onclick = ()=>{select('#endDiv').hide(); currentTrainBlock++; clearInterval(timer);sessionComplete++; trainBlockStart();};
    } else {
        if(graceTime+timerCount==60) {
            select('#endInstr').html(`<br><br><br><span style="color:red;">Are you still there? Please click the button now or the experiment will terminate.</span>`); // show timer : <br><span style="color:red;">${Math.floor((graceTime+timerCount)/60)} : ${String((graceTime+timerCount)%60).padStart(2,'0')}</span>
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
function handleMouseMove1(e) {
    if(movin&&freeze<1) {
        var scaledMovementX;
        var scaledMovementY;
        //inactivity = 0;
        scaledMovementX = e.movementX/16*actGain;
        angleV2 += scaledMovementX;
        //angleV2 = fixBetween(angleV1, -maxA, +maxA);
    }
}
function handleTiltKeyDown(e) {
    if(e.key==='z' || e.key==='Z')
        keyState['z'] = true;
    if(e.key==='x' || e.key==='X')
        keyState['x'] = true;
    if(e.key==='.')
        keyState['.'] = true;
    if(e.key==='/')
        keyState['/'] = true;
}
function handleTiltKeyUp(e) {
    if(e.key==='z' || e.key==='Z')
        keyState['z'] = false;
    if(e.key==='x' || e.key==='X')
        keyState['x'] = false;
    if(e.key==='.')
        keyState['.'] = false;
    if(e.key==='/')
        keyState['/'] = false;
}
function moveNoise(mode) {
    return 0;
    /*const mean = 0;
    const std = 0.05;
    return randomGaussian(mean, std);*/
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
    document.getElementById("container-exp").onmousemove = null;
    document.onkeydown = null;
    document.onkeyup = null;
    document.body.style.overflow = 'auto';
    if(reason == 2) {
        timerCount = 120;
        //show('failed-2-return', 'failed-2-disqualify');
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
    /*alph = Number(values[0].value);
    v_scale = values[1].value === "1";
    if(values[2].value === "0")
        trainBlocks = [4,5];
    else
        trainBlocks = [5];
    var b_candidates = [[[1,1],[1,-1]], [[1,1],[-1,1]], [[1,1],[-1,-1]]];
    b_val = b_candidates[Number(values[3].value)];
    tilt_mode = Number(values[4].value);
    beta = Number(values[5].value); */
    rolTorque = Number(values[0].value);
    yawGain = Number(values[1].value);
    rolGain = Number(values[2].value);
    actGain = Number(values[3].value);
    pathWidth = Number(values[4].value);
    //A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.13860977,-0.47791902*rolGain,0.98796909,-0.03447076*rolGain],[0.22055914*yawGain,-0.96991869,0.36958883*yawGain,0.69334504]];
    //B_mat = [[0,0,],[0,0],[0.00049015,-0.00235801*rolGain],[-0.00235801*yawGain,0.07243802]];
    A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.15816291,-0.54424403*rolGain,0.98944776,-0.03305154*rolGain],[0.19532461*yawGain,-0.66788316,0.36768052*yawGain,0.69151345]];
    B_mat = [[0,0,],[0,0],[0.00026558,-0.0020682*rolGain],[-0.0020682*yawGain,0.072064]];
    //A_mat = [[1.0,0.0,0.01666667,0],[0,1,0,0.01666667],[0.16092399,-0.55506117*rolGain,0.99278081,-0.03609265*rolGain],[0.11003513*yawGain,-0.29229215,0.20387766*yawGain,0.74140705]];
    //B_mat = [[0,0,],[0,0],[0.00024422,-0.00141493*rolGain],[-0.00141493*yawGain,0.03995926]];
    var b_candidates = [[[1,1],[1,-1]], [[1,1],[-1,1]], [[1,1],[-1,-1]]];
    tilt_mode = Number(values[5].value);
    action_mode = Number(values[6].value);
    b_val = b_candidates[0];
    let nor = Number(values[7].value);
    if(nor == 0)
        trainBlocks = [4];
    else
        trainBlocks = [5];
    
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    h = min(windowHeight*1/6, 100);
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x/0.75*0.8;
    scaling_base = sx < sy? sx:sy;
    select('#cover').hide();
    totalTrainBlocks = trainBlocks.length;
    sessionComplete = 0;
    maxA = PI/3;
    highscore = [-1,-1];
    sessionTotal = computeSessionTotal();
    trainBlockStart();
}
// Function that ends the game appropriately after the experiment has been completed
function endGame() {
    select('#container-exp').hide();
    remove();
    document.getElementById("container-exp").onmousemove = null;
    document.onkeydown = null;
    document.onkeyup = null;
    document.body.style.overflow = 'auto';
}
function windowResized() {
    console.log("resized1 "+isDraw);
    resizeCanvas(windowWidth, windowHeight);
    // set scaling depending on screen size
    let sx = windowWidth/width_x*0.8;
    let sy = windowHeight/width_x/0.75*0.8;
    scaling_base = sx < sy? sx:sy;
    scaling = scaling_base;
    console.log("resized2 "+isDraw);
}
function show(shown, hide) {
    document.getElementById(shown).style.display = 'block';
    document.getElementById(hide).style.display = 'none';
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    return false;
}
function helpEnd() {}