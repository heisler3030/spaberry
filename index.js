const Express = require('express');
const app = Express();
//const Gpio = require('onoff').Gpio;
const Gpio = require('pigpio').Gpio;

// const clock = new Gpio(5, 'in', 'rising');
// const data = new Gpio(6, 'in');
// const controls = new Gpio(13, 'in');

const clock = new Gpio(5, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
const data = new Gpio(6, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
const controls = new Gpio(13, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});

//let lastClock = process.hrtime.bigint();
let lastTick = 0;
let clockCount = 0;
let frameCount = 0;
let dataFrame = [];
let controlsFrame = "";
let status = "";
let dataBit = "";

// clock.watch((err, value) => {
//     if (err) {
//         throw err;     
//     }
//     let thisClock = process.hrtime.bigint();
//     //dataBit = data.readSync();
//     //let controlsBit = controls.readSync();
//     if (thisClock > lastClock + BigInt(2e7)) {
//         newframe(dataFrame, clockCount);
//     }
//     // dataFrame += dataBit;
//     //controlsFrame += controlsBit;
//     clockCount++;
//     lastClock = thisClock;
// });

// clock.on('interrupt', (level,tick) => {
//     if ((tick >> 0) > (lastTick >> 0) + 10000) { // if last tick was over 10ms ago
//         newframe(dataFrame, clockCount);
//     }
//     dataFrame.push(data.digitalRead());
//     clockCount++
//     lastTick = tick;
// });


let zeroCushion = 2000;
let sampleLength = 2000;

function readData() {
    let clockArray = [];
    let dataArray = [];
let head = 0;
    

    while(true) {
	head = 0;
        while (clock.digitalRead() == 0) {
            head++;
        }
        if (head > zeroCushion) break;
    }
    
    dataArray.push(data.digitalRead());
    clockArray.push(1);
    
    
    let i = 0;
    while(true) {
        clockArray.push(clock.digitalRead());
        dataArray.push(data.digitalRead());
        i++
        if (i > sampleLength) break;
    }
    return [clockArray, dataArray, head];
    
}

function generateBits(clockArray, dataArray) {
    let bits = [];
    let i = 0;
    let len = clockArray.length
    while (i < len) {
        while (i < len && clockArray[i]==0) i++;  // Find the first clock rise
        let dataVal = 0;
        while (i < len && clockArray[i]==1) {
            if (dataArray[i] == 1) dataVal = 1;
            i++;
        }
        bits.push(dataVal);
    }
    return bits;
}


function newframe(df, cc) {
    status = `${df}|${controlsFrame}|${cc} ticks|${frameCount} frames`;
    dataFrame = [];
    controlsFrame = "";
    clockCount=0;
    frameCount++;
    //console.log(status);
}

process.on('SIGINT', _ => {
  clock.unexport();
  data.unexport();
  controls.unexport();
});
 
app.get('/', function (req, res) {
    let rawdata = readData();
    let bits = generateBits(rawdata[0], rawdata[1]).join('');
    //let webStatus = status.replaceAll('|', '<br>');
    res.send(`Status:  ${bits} Length: ${bits.length} Head: ${rawdata[2]}`);
});

app.get('/temp', async function (req, res) {
  res.send('Temperature');
});

app.listen(process.env.PORT || 3000);
