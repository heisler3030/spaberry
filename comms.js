const Gpio = require('pigpio').Gpio;
const Notifier = require('pigpio').Notifier;
const Config = require('./config');
// const debug = false
const debug = Config.debug;

const clockPin = 5;  // pin with clock signal from board
const dataPin = 6; // pin with communications from board to display
const controlPin = 13; // pin with communications from panel to board
let tickThreshold = 5000; // minimum microseconds of clock silence

const UP_BUTTON = 14 //[1,1,1,0]
const DOWN_BUTTON = 15 //[1,1,1,1]
const MODE_BUTTON = 8 //[1,0,0,0]

// const clock = new Gpio(clockPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const data = new Gpio(dataPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const control = new Gpio(controlPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});

module.exports.readData = () => {
    return new Promise((resolve, reject) => {
        const notifier = new Notifier() // idle notifier
        let lastTick;
        let dataReady = false;
        let dataArray = []
        let controlsArray = []


        if (debug) console.log("starting notifier...");

        notifier.start(1 << clockPin) // notify on changes to the clockPin (bitwise)
        bitstream = notifier.stream();

        bitstream.on('data', (buf) => {
            if (debug) console.log(`inbound data received`);

            for (let ix = 0; ix < buf.length; ix += Notifier.NOTIFICATION_LENGTH) {
                const seqno = buf.readUInt16LE(ix);
                const tick = buf.readUInt32LE(ix + 4);
                const level = buf.readUInt32LE(ix + 8);

                const clock = level & (1 << clockPin)  // bitwise read of GPIO5
                if (!clock) continue; // only read where clock is high

                const tickdiff = tick - (lastTick || tick);  // hrtime since last high clock (or is for first iteration where there is no lastTick)
                
                // Ensure we are at start of clock by waiting for a gap of at least 10000us (skip this once we are reading data)
                if (!dataReady && tickdiff < tickThreshold) {
                    if (debug) console.log(`awaiting start tick: ${tickdiff}`)
                    lastTick = tick;
                    continue
                } else dataReady = true; // set dataReady once we see a long gap
                                
                if (dataArray.length > 0 && tickdiff >= tickThreshold) {  // Once we are reading data, break if we see another big tickdiff
                    if (debug) console.log(`break on tickdiff = ${tickdiff}`)
                    bitstream.destroy();
                    break
                };

                let dataBit = ((level & (1 << dataPin)) != 0) ? 1 : 0;  // read data pin
                dataArray.push(dataBit);
                
                let controlsBit = ((level & (1 << controlPin)) != 0) ? 1 : 0;  // read control pin
                controlsArray.push(controlsBit);
                

                if (debug) console.log(`GPIO6 = ${dataBit} Seqno = ${seqno} Tickdiff = ${tickdiff} Bitcount: ${dataArray.length}`);
                lastTick = tick;
            }
        });

        bitstream.on('close', (data) => {
            if (debug) console.log(`closing notifier...`);
            notifier.close();
            if (debug) console.log(`returning [${dataArray.join('')}]`)
            resolve(
                {
                    dataArray: dataArray,
                    controlsArray: controlsArray
                }
            );
        });
    })
}

module.exports.sendCommand = () => {
    return new Promise((resolve, reject) => {

        // Create Clock listener and register interrupts
        let clock = new Gpio(clockPin, {mode: Gpio.INPUT});
        let control = new Gpio(controlPin, {mode: Gpio.INPUT});
        let lastTick;
        let dataReady = false;
        let bitcount = 0
        //let tickdiff = 0

        clock.enableInterrupt(Gpio.RISING_EDGE)


        // On interrupt count 72 ticks
        clock.on('interrupt', (level,tick) => {
            let tickdiff = tick - (lastTick || tick);  // hrtime since last high clock (or is for first iteration where there is no lastTick)
            // Ensure we are at start of clock by waiting for a gap of at least 10000us (skip this once we are reading data)
            if (!dataReady && tickdiff < tickThreshold) {
                if (debug) console.log(`awaiting start tick: ${tickdiff}`)
                lastTick = tick;
            } else if (dataReady && tickdiff > tickThreshold) { // turn off interrupts once we see a second long gap
                if (debug) console.log(`Exiting on tickdiff ${tickdiff} with bitcount ${bitcount}`)
                clock.disableInterrupt()
                resolve()
            }
            else { 
                dataReady = true; // set dataReady once we see a long gap
                //if (tick > tickThreshold) 

                // On down edge activate output GPIO
                // On 4th write close GPIOs
                
                bitcount++
                //if (debug) console.log(`Bitcount: ${bitcount}, Level: ${level}, Tick: ${tickdiff}`)
                lastTick = tick
                
                
            }
        })
        
    })
}

// function _readPanel() {
//     let clockArray = [];
//     let panelArray = [];
//     let head = 0;

//     while(true) { // Wait until there are at least <zeroCushion> leading 0's on the clock line
// 	    head = 0;
//         while (clock.digitalRead() == 0) {
//             head++;
//         }
//         if (head > zeroCushion) break;
//     }
    
//     let startTime = process.hrtime.bigint();
//     let i = 0;
    
//     panelArray.push(panel.digitalRead());
//     clockArray.push(1);    

//     while(i <= sampleLength) {  // Read clock and data as fast as possible for $sampleLength iterations
//         panelArray.push(panel.digitalRead());
//         clockArray.push(clock.digitalRead());
//         i++;
//     } 
//     let elapsed = process.hrtime.bigint() - startTime;
//     return [clockArray, panelArray, head, elapsed];
// }