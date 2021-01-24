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
let debug = true;

let zeroCushion = 2500;
let sampleLength = 2500;

const onesMap = {
    "11111101":0, 
    "01100001":1,
    "11011011":2,
    "11110011":3,
    "01100111":4,
    "10110111":5,
    "10111111":6,
    "11100001":7,
    "11111111":8,
    "11100111":9,
    "01000111":"F"   
}

const tensMap = {
    "11111100":8,
    "11001100":9,
    "11111001":10,
    "01000111":"F"   
}

function _decodeDisplay (dataArray) {
    let byte1 = dataArray.substring(0,8);
    let byte2 = dataArray.substring(8,16);
    let byte3 = dataArray.substring(16,24);
    
    let digit4 = tensMap[byte1] || "?";
    let digit3 = onesMap[byte2] || "?";
    let digit2 = tensMap[byte3] || "?";
    
    
    if (debug) {
        console.log(`${byte3} --> ${digit2}`);
        console.log(`${byte2} --> ${digit3}`);
        console.log(`${byte1} --> ${digit4}`);
    }
    
    return [digit2, digit3, digit4].join('');
}

function _getBinaryData () {
    let bits = "";
    let lastbits = "lastbits";
    let tries = 0;
    while (true){
        bits = "";
        while (bits.length < 76) {
            let rawdata = _readData();
            let clockSamples = rawdata[0];
            let dataSamples = rawdata[1];
            let trailingZeros = rawdata[0].length - rawdata[0].lastIndexOf(1)
            bits = _generateBits(rawdata[0], rawdata[1]).join('');
            if (debug) console.log(`bits: ${bits.length}`);
            tries++
        }
        if (bits == lastbits || tries >= 30) {
            break;
        } else {
            lastbits = bits;
            //tries++;
        }
    }
    return [bits,tries];
}


function _readData() {
    let clockArray = [];
    let dataArray = [];
    let head = 0;

    while(true) { // Wait until there are at least <zeroCushion> leading 0's on the clock line
	    head = 0;
        while (clock.digitalRead() == 0) {
            head++;
        }
        if (head > zeroCushion) break;
    }
    
    let startTime = process.hrtime.bigint();
    let i = 0;
    
    dataArray.push(data.digitalRead());
    clockArray.push(1);    

    while(i <= sampleLength) {  // Read clock and data as fast as possible for $sampleLength iterations
        dataArray.push(data.digitalRead());
        clockArray.push(clock.digitalRead());
        i++;
    } 
    let elapsed = process.hrtime.bigint() - startTime;
    return [clockArray, dataArray, head, elapsed];
}

function _generateBits(clockArray, dataArray) {
    let bits = [];
    let i = 0;
    let len = clockArray.length
    while (true) {
        while (i < len && clockArray[i]==0) i++;  // Find the first clock rise
        let dataVal = 0;
        while (i < len && clockArray[i]==1) { // Sample data while it's high
            if (dataArray[i] == 1) dataVal = 1;
            i++;
        }
        if (i >= len) break;
        bits.push(dataVal);
    }
    return bits;
}

process.on('SIGINT', _ => {
  clock.unexport();
  data.unexport();
  controls.unexport();
});



app.get('/', function (req, res) {

    let [bits, tries] = _getBinaryData();
    let display = _decodeDisplay(bits);

    //let webStatus = status.replaceAll('|', '<br>');
    // res.send(`Status:<br>${bits} <br>${eightySevenF}<br> Length: ${bits.length} Head: ${rawdata[2]} <br> Samples: ${clockSamples.length} SamplingTime: ${rawdata[3]} us  TrailingZeros ${trailingZeros} in ${tries} tries`);
    res.send(`Status:<br>${bits}<br> in ${tries} tries<br><br>Current Temp is ${display}`);
});

app.get('/temp', async function (req, res) {
  res.send('Temperature');
});

app.listen(process.env.PORT || 3000);


