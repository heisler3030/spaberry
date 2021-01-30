const Express = require('express');
const app = Express();
const Gpio = require('pigpio').Gpio;
const Notifier = require('pigpio').Notifier;

const clockPin = 5;
const dataPin = 6;

// const clock = new Gpio(5, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const data = new Gpio(6, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const panel = new Gpio(13, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});


//let lastClock = process.hrtime.bigint();
//let lastTick = 0;
let clockCount = 0;
let frameCount = 0;
let dataFrame = [];
let controlsFrame = "";
let status = "";
let dataBit = "";
let debug = true;

let zeroCushion = 2500;
let sampleLength = 2500;
let clockLength = 76;
let tickThreshold = 5000;

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
    
    let mode = (dataArray.substring(60,1) == 1) ? "Standard" : "Economy"; 
    
    if (debug) {
        console.log(`Digit 2: ${byte3} --> ${digit2}`);
        console.log(`Digit 3: ${byte2} --> ${digit3}`);
        console.log(`Digit 4: ${byte1} --> ${digit4}`);
        console.log(`Mode: ${mode} --> ${mode}`);
    }
    
    return {
        display: [digit2, digit3, digit4].join(''),
        mode: mode
    }
}

async function _getBinaryData () {
    let bits = "";
    let tries = 0;
    let rawdata = await _readData();
    console.log("got rawdata")
    // while (true){
    //     bits = "";
    //     while (bits.length < 76) {
            
    //         // let clockSamples = rawdata[0];
    //         // let dataSamples = rawdata[1];
    //         // let trailingZeros = rawdata[0].length - rawdata[0].lastIndexOf(1)
    //         // bits = _generateBits(rawdata[0], rawdata[1]).join('');
    //         // if (debug) console.log(`bits: ${bits.length}`);
    //         // tries++
    //     }
    //     if (bits == lastbits || tries >= 30) {
    //         break;
    //     } else {
    //         lastbits = bits;
    //         //tries++;
    //     }
    // }
    return rawdata.join('')
}


function _readData() {
    return new Promise((resolve, reject) => {
        let notifier = new Notifier() // idle notifier

        let dataArray = [];
        let n = 0;
        dataArray = [];
        let lastTick;
        let bitcount = 0;
        let dataReady = false;

        if (debug) console.log("starting notifier...");

        notifier.start(1 << clockPin) // track changes on the clockPin (bitwise)
        bitstream = notifier.stream();

        bitstream.on('data', (buf) => {
            if (debug) console.log(`inbound data received`);


            for (let ix = 0; ix < buf.length; ix += Notifier.NOTIFICATION_LENGTH) {
                const seqno = buf.readUInt16LE(ix);
                const tick = buf.readUInt32LE(ix + 4);
                const level = buf.readUInt32LE(ix + 8);

                const clock = level & (1 << clockPin)  // bitwise read of GPIO5
                if (!clock) continue; // only read where clock is high

                const tickdiff = tick - (lastTick || tick);  // hrtime since last high clock
                
                // Ensure we are at start of clock by waiting for a gap of at least 10000us (skip this once we are reading data)
                if (!dataReady && tickdiff < tickThreshold) {
                    if (debug) console.log(`awaiting start tick: ${tickdiff}`)
                    lastTick = tick;
                    continue
                } else dataReady = true; // set dataReady once we see a long gap
                                
//                if (debug && tickdiff >= tickThreshold) console.log(`got starttick @ ${tickdiff}`)

                if (dataArray.length > 0 && tickdiff >= tickThreshold) {  // Once we are reading data, break if we see another big tickdiff
                    console.log(`break on tickdiff = ${tickdiff}`)
                    bitstream.destroy();
                    break
                };

                let dataBit = ((level & (1 << dataPin)) != 0) ? 1 : 0;  // read data pin
                dataArray.push(dataBit);

                bitcount++;


                console.log(`GPIO6 = ${dataBit} Seqno = ${seqno} Tickdiff = ${tickdiff} Bitcount: ${dataArray.length}`);
                lastTick = tick;
                
                n++;

                if (n >= 2000) {
                    console.log("break on large n");
                    bitstream.destroy();
                    break;
                }        

            }
        });

        bitstream.on('close', (data) => {
            if (debug) console.log(`closing notifier...`);
            notifier.close();
            if (debug) console.log(`returning [${dataArray.join('')}]`)
            resolve([dataArray, n]);
        });
    })
}


function _readPanel() {
    let clockArray = [];
    let panelArray = [];
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
    
    panelArray.push(panel.digitalRead());
    clockArray.push(1);    

    while(i <= sampleLength) {  // Read clock and data as fast as possible for $sampleLength iterations
        panelArray.push(panel.digitalRead());
        clockArray.push(clock.digitalRead());
        i++;
    } 
    let elapsed = process.hrtime.bigint() - startTime;
    return [clockArray, panelArray, head, elapsed];
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



app.get('/', async function (req, res) {
    let [bits, tries] = await _getBinaryData();
    let decoded =  _decodeDisplay(bits);
    let display = decoded.display;
    let mode = decoded.mode;

    //let webStatus = status.replaceAll('|', '<br>');
    // res.send(`Status:<br>${bits} <br>${eightySevenF}<br> Length: ${bits.length} Head: ${rawdata[2]} <br> Samples: ${clockSamples.length} SamplingTime: ${rawdata[3]} us  TrailingZeros ${trailingZeros} in ${tries} tries`);
    res.send(`Status:<br>${bits}<br> in ${tries} tries<br><br>Current Temp is ${display} <br>Mode is ${mode}`);
});

app.get('/panel', async function (req, res) {
    let [bits, tries] = _getBinaryData();
    let decoded =  _decodeDisplay(bits);
    let display = decoded.display;
    let mode = decoded.mode;

    //let webStatus = status.replaceAll('|', '<br>');
    // res.send(`Status:<br>${bits} <br>${eightySevenF}<br> Length: ${bits.length} Head: ${rawdata[2]} <br> Samples: ${clockSamples.length} SamplingTime: ${rawdata[3]} us  TrailingZeros ${trailingZeros} in ${tries} tries`);
    res.send(`Status:<br>${bits}<br> in ${tries} tries<br><br>Current Temp is ${display} <br>Mode is ${mode}`);
});

app.listen(process.env.PORT || 3000);


