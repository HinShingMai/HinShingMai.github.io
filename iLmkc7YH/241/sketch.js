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
let amplitudes = [[1/2,-1/4,-1/16,1/8,-1/16,-1/32,1/64,1/32],[0,1/4,1/16,1/8,-1/16,-1/32,1/64,1/32]];
let frequency = [[1/24,1/6,2/6,3/6,5/6,7/6,8/6,12/6],[1/24,1/6,2/6,3/6,5/6,7/6,8/6,12/6]];
let frameNum = 0; // Number of frames in the current session
var dotX;
var dotY;
//var dotV = [1.0, 1.0];
var dotA;
var maxY;
var width_x = 240;
var scaling_base;
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
var famTargets;
var famTargetState;
var famTargetNext;
var famTargetInterval = 180;
var famScore;
var freeze;
var freeze_time = 200;
var freeze_margin;
var dotU = [0,0];
var maxV = [1.8,1.8];
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
    sessionInfo();
}
function sessionNext() {
    //isdraw = false;
    //document.getElementById("container-exp").onmousemove = null;
    //document.exitPointerLock();
    window.removeEventListener("deviceorientationabsolute", handleDeviceOrientation);
    noLoop();
    clear();
    currentSession++;
    sessionComplete++;
    sessionInfo();
}
function startSession() {
    dotY = 0;
    dotA = 0;
    angAcc = 0;
    dotU = [0,0];
    //maxY = width_x*0.625; //150
    isDraw = true;
    select('#container-exp').show()
    //document.getElementById("container-exp").onmousemove = handleMouseMove;
    //document.getElementById("container-exp").requestPointerLock();
    window.addEventListener("deviceorientationabsolute", handleDeviceOrientation, false);
    dis = []; 
    ang = [];
    act = [];
    vDist = [];
    nse = [];
    dis_temp = []; 
    ang_temp = [];
    act_temp = [];
    vDist_temp = [];
    nse_temp = [];
    maxPoints = 0;
    if(sessionsType[currentSession] < 2) { // empty session
        isTest = false;
        maxPoints = 3600;
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
            maxY = width_x; //240
            maxX = maxY/2;
            scaling = scaling_base;
            if(highscore[offset]<0) // don't shuffle for the first test
                blank = [1/30,1/15,0.1,2/15,0.2,1/3,0.5,112/150,1]; // 9 sub-sessions
            else
                blank = shuffle([1/30,1/15,0.1,2/15,0.2,1/3,0.5,112/150,1]);
        } else {
            maxPoints = 2400;
            blanknum = 0;
            maxY = width_x; //240
            maxX = maxY/2;
            scaling = scaling_base;
            blank = [1,1,1,1]; // 4 sub-sessions
        }
        if(sessionsType[currentSession]>3) {
            lines = sinuousCurve(maxPoints, isTest);
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
        dotX = lines[blanknum][0];
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
    //movin=false;
    movin = true;
    fps = 0.0;
    frBuffer = 60.0;
    plen = maxPoints+straightLen;
    freeze = 60;
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
            let data = [
                {x: blockNam, y: blockErr, type: 'scatter', mode: 'lines', line: {color: 'green', width: 3}, name: 'Error'},
                {x: blockErrn_x, y: blockErrn, type: 'scatter', mode: 'markers', marker: {color: 'blue', size: 10}, name: 'Normal'},
                {x: blockErrr_x, y: blockErrr, type: 'scatter', mode: 'markers', marker: {color: 'red', size: 10}, name: 'Reverse'},
                //{x: Array.from(Array(act.length).keys()), y: act, xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {color: 'black', width: 3}, name: 'Actions'},
                {x: idx, y: lines[0], xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {color: 'black', width: 3}, name: 'Path'},
                {x: vDist[0], y: dis[0], xaxis: 'x2', yaxis: 'y2', type: 'scatter', mode: 'lines', line: {color: 'blue', width: 3}, name: 'You'},
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
            plot.html(msg);
        }
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
    button.onclick = ()=>{clearTimeout(timer);butfunc();};
}
function draw() {
    if(isDraw) {
        if(-dotY >= plen) {
            // record final trajectories
            dis_temp.push(dotX);
            vDist_temp.push(-dotY);
            ang_temp.push(dotA);
            act_temp.push(angAcc);
            nse_temp.push(noise);
            dis.push(dis_temp);
            vDist.push(vDist_temp);
            ang.push(ang_temp);
            act.push(act_temp);
            nse.push(nse_temp);
            dis_temp = []; 
            ang_temp = [];
            act_temp = [];
            vDist_temp = [];
            nse_temp = [];
            if(blanknum < blank.length-1) { // next sub-session
                blanknum++;
                dotX = lines[blanknum][0];
                dotY = 0;
                dotA = 0.0;
                angAcc = 0.0;
                //movin=false;
                freeze = 60;
            } else {
                //console.log("draw end: "+isDraw)
                isDraw = false;
                sessionNext();
                return;
            }
        } /*else if(!movin && -dotY>=plen*blanknum+straightLen*0.75) // enable controls after a short freeze at the beginning
            movin=true;*/
        if(freeze<1) {
            //var noise = moveNoise(sessionsType[currentSession]);
            var noise = 0;
            // record trajectory
            dis_temp.push(dotX);
            vDist_temp.push(-dotY);
            ang_temp.push(dotA);
            act_temp.push(angAcc);
            nse_temp.push(noise);
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
                var pathError = 0;//linearError();
                if(angAcc==act[act.length-2]) {
                    if(pathError>pathWidth)
                        inactivity += 1;
                } else if(inactivity > 0)
                    inactivity -= 1;
                /*if(pathError > pathWidth)
                    inactivity++;*/
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
            //dotX  = dotX + Math.tan(dotA);
            var b = offset==0? 1: -1;
            dotX = dotX + b*fixBetween(dotU[0],-30,30)*maxV[0]/30;
            if(dotX < -maxX*0.9) { // hits edge
                freeze_margin += 1;
                if(lines!=null&&freeze_margin>60) {
                    dotX = (dotX+lines[blanknum][-dotY])/2.0;
                    freeze = freeze_time;
                    freeze_margin = 0;
                }
                if(dotX < -maxX) {
                    dotX = -maxX;
                    dotA = 0;
                }
            } else if(dotX > maxX*0.9) {
                freeze_margin += 1;
                if(lines!=null&&freeze_margin>60) {
                    dotX = (dotX+lines[blanknum][-dotY])/2.0;
                    freeze = freeze_time;
                    freeze_margin = 0;
                }
                if(dotX > maxX) {
                    dotX = maxX;
                    dotA = 0;
                }
            } else if(freeze_margin > 0)
                freeze_margin -= 1;
            
            /*if(offset == 0)
                dotU = angAcc;
            else
                dotU = -angAcc;
            
            //dotA = dotA + dotU;
            //dotA = dotA + (2/(1+Math.exp(-64*dotU))-1)*maxA/20;
            dotA = dotA + maxA/20/8*Math.log2((9.5*dotU+0.5)/(1-9.5*dotU-0.5));
            if(dotA < -maxA) {
                dotA = -maxA;
                angAcc = 0;
                dotU = 0;
            } else if(dotA > maxA) {
                dotA = maxA;
                angAcc = 0;
                dotU = 0;
            }*/
            
            //dotY -= 1;
            dotY = dotY + b*fixBetween(dotU[1],-30,30)*maxV[1]/30;
            if(movin)
                error += pathError;
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
        let high = int(maxY*blank[blanknum]-dotY);
        translate(windowWidth/2, windowHeight*2/3 - dotY*scaling);
        rect(-maxX*scaling, -(maxY-dotY)*scaling, maxX*scaling*2, maxY*scaling*1.5);
        drawCurve(lines[blanknum], -dotY-1, min(high,plen));
        drawBike();
        drawTrace();
        // save framerate
        fr = frameRate();
        if(frameNum%10==0)
            frBuffer = fr.toFixed();
        stroke('black');
        fill('black');
        textSize(12);
        strokeWeight(1);
        text("FPS: "+frBuffer, maxX*scaling-50, -(maxY-dotY)*scaling+10);
        if(freeze<1) { 
            fps += fr;
            frameNum++;
        }
    }
}
function resetAndUnfreeze() {
    //dotX = (dotX+lines[-dotY])/2.0;
    /*dotA = 0;
    angAcc = 0;*/
    dotU = [0,0];
}
function fixBetween(x, minimum, maximum) {
    if(x < minimum)
        return minimum;
    else if(x > maximum)
        return maximum;
    return x;
}
function linearError() { // horizontal distance to trajectory
    if(dotY>0 || -dotY>=lines[blanknum].length)
        return 0;
    return Math.abs(dotX-lines[blanknum][-Math.floor(dotY)]);
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
    if(isTest) { // generate the same sub-trajectories for testing
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
            paths.push(Array(straightLen).fill(path[0]).concat(path));
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
            paths.push(Array(straightLen).fill(path[0]).concat(path));
        }
        return paths;
    }
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
function drawCurve(coords, start, end) {
    if(coords!==null) {
        noFill();
        let startFix = Math.floor(start+1);
        if(startFix < 0)
            startFix = 0;
        let endFix = Math.ceil(end);
        if(endFix > coords.length)
            endFix = coords.length;
        stroke('grey');
        strokeWeight(6);
        for(let i = startFix+1; i<endFix; i++)
            line(coords[i-1]*scaling, (1-i)*scaling, coords[i]*scaling, -i*scaling);
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
            noStroke();
            ellipse(dotX*scaling, dotY*scaling, 20,20);
            strokeWeight(3);
            /*triangle(x+15*sin(heading+A), y-15*cos(heading+A), x+6*cos(heading+A), y+6*sin(heading+A), x-6*cos(heading+A), y-6*sin(heading+A));
            noFill();
            curve(x+d*cos(heading),y+d*sin(heading), x, y, x-45*sin(heading), y+45*cos(heading), x-45*sin(heading)+d*cos(heading), y+45*cos(heading)+d*sin(heading));*/
        }
    } else {
        stroke(color);
        fill(color);
        noStroke();
        ellipse(dotX*scaling, dotY*scaling, 20,20);
        /*strokeWeight(3);
        let heading = dotA;
        let x = dotX*scaling;
        let y = dotY*scaling;
        let A = dotU*20;
        let d = dotU*4800/PI;
        triangle(x+15*sin(heading+A), y-15*cos(heading+A), x+6*cos(heading+A), y+6*sin(heading+A), x-6*cos(heading+A), y-6*sin(heading+A));
        //triangle(x+15*sin(heading), y-15*cos(heading), x+6*cos(heading), y+6*sin(heading), x-6*cos(heading), y-6*sin(heading));
        noFill();
        curve(x+d*cos(heading),y+d*sin(heading), x, y, x-45*sin(heading), y+45*cos(heading), x-45*sin(heading)+d*cos(heading), y+45*cos(heading)+d*sin(heading));
        //line(x,y,x-45*sin(heading-A), y+45*cos(heading-A));
        let lLimit = min(maxX+dotX,maxY);
        let rLimit = min(maxX-dotX,maxY);*/
        stroke('grey');
        strokeWeight(1);
        //line(dotX*scaling,dotY*scaling,(dotX-lLimit)*scaling,(dotY-lLimit)*scaling);
        //line(dotX*scaling,dotY*scaling,(dotX+rLimit)*scaling,(dotY-rLimit)*scaling);
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
    //document.exitPointerLock();
    noLoop();
    clear();
    //isdraw = false;
    let htmlDiv = select('#endDiv');
    let instr = select('#endInstr');
    htmlDiv.show();
    select('#container-exp').hide()
    //document.getElementById("container-exp").onmousemove = null;
    window.removeEventListener("deviceorientationabsolute", handleDeviceOrientation);
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
    select('#container-exp').show()
    //document.getElementById("container-exp").onmousemove = handleMouseMove;
    //document.getElementById("container-exp").requestPointerLock();
    window.addEventListener("deviceorientationabsolute", handleDeviceOrientation, false);
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
function handleMouseMove(e) {
    if(movin) {
        var scaledMovement;
        //inactivity = 0;
        scaledMovement = e.movementX/5000;
        angAcc += scaledMovement;
        angAcc = fixBetween(angAcc, -maxA/20, +maxA/20);
    }
}
function handleDeviceOrientation(e) {
    if(movin) {
        dotU[1] = event.beta;
        dotU[0] = event.gamma;
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
    //document.getElementById("container-exp").onmousemove = null;
    window.removeEventListener("deviceorientationabsolute", handleDeviceOrientation);
    document.body.style.overflow = 'auto';
    if(reason == 2) {
        timerCount = 120;
        //show('failed-2-return', 'failed-2-disqualify');
        timer = setTimeout(()=>{show('failed-2-disqualify', 'failed-2-return');remove();window.fullscreen(false);screen.orientation.unlock();helpEnd();}, timerCount*1000);
        let btn = document.getElementById("returnBt");
        btn.onclick = ()=>{select('#failed-2').hide();show('container-exp', 'container-failed');document.body.style.overflow = 'hidden';clearTimeout(timer);butfunc();};
    } else {
        remove();
        window.fullscreen(false);
        screen.orientation.unlock();
        helpEnd();
    }
}
function startGame() {
    var values = document.getElementsByName('cover-select');
    let nor = Number(values[0].value);
    if(nor == 0)
        trainBlocks = [4];
    else
        trainBlocks = [5];
    
    cnv = createCanvas(windowWidth, windowHeight);
    console.log(cnv.size());
    cnv.parent("container-exp");
    document.body.style.overflow = 'hidden';
    h = min(windowHeight*1/6, 100);
    let sx = windowWidth/width_x;
    let sy = windowHeight/width_x/1.5;
    scaling_base = sx < sy? sx:sy;
    select('#instrDiv').hide();
    totalTrainBlocks = trainBlocks.length;
    sessionComplete = 0;
    maxA = PI/3;
    highscore = [-1,-1];
    sessionTotal = computeSessionTotal();
    window.fullscreen(true);
    screen.orientation.lock("portrait");
    trainBlockStart();
}
// Function that ends the game appropriately after the experiment has been completed
function endGame() {
    select('#container-exp').hide();
    remove();
    window.fullscreen(false);
    screen.orientation.unlock()
    //document.getElementById("container-exp").onmousemove = null;
    //document.body.style.overflow = 'auto';
    window.removeEventListener("deviceorientationabsolute", handleDeviceOrientation);
}
function windowResized() {
    console.log("resized1 "+isDraw);
    resizeCanvas(windowWidth, windowHeight, true);
    // set scaling depending on screen size
    let sx = windowWidth/width_x;
    let sy = windowHeight/width_x/1.5;
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