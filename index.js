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
let eightySevenF="0100011111100001111111000000000001000000000010000000000000001000000000000000";

let zeroCushion = 2500;
let sampleLength = 2500;

function readData() {
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

function generateBits(clockArray, dataArray) {
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
    let bits = "";
    let lastbits = "lastbits";
    let tries = 0;
    while (true){
        bits = "";
        while (bits.length < 76) {
            let rawdata = readData();
            let clockSamples = rawdata[0];
            let dataSamples = rawdata[1];
            let trailingZeros = rawdata[0].length - rawdata[0].lastIndexOf(1)
            bits = generateBits(rawdata[0], rawdata[1]).join('');
            console.log(`bits: ${bits.length}`);
        }
        if (bits == lastbits || tries >= 30) {
            console.log("inif");
            break;
        } else {
            lastbits = bits;
            console.log("inelse");
            tries++;
        }
    }
    

    //let webStatus = status.replaceAll('|', '<br>');
    // res.send(`Status:<br>${bits} <br>${eightySevenF}<br> Length: ${bits.length} Head: ${rawdata[2]} <br> Samples: ${clockSamples.length} SamplingTime: ${rawdata[3]} us  TrailingZeros ${trailingZeros} in ${tries} tries`);
    res.send(`Status:<br>${bits} <br>${eightySevenF}<br> in ${tries} tries`);
});

app.get('/temp', async function (req, res) {
  res.send('Temperature');
});

app.listen(process.env.PORT || 3000);
