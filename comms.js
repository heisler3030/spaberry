const Gpio = require('pigpio').Gpio;
const Notifier = require('pigpio').Notifier;
const Config = require('./config');
const debug = Config.debug;

const clockPin = 5;
const dataPin = 6;
const controlPin = 13;
let tickThreshold = 5000; // minimum microseconds of clock silence

// const clock = new Gpio(clockPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const data = new Gpio(dataPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const control = new Gpio(controlPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});


module.exports.readData = () => {
    return new Promise((resolve, reject) => {
        let notifier = new Notifier() // idle notifier

        let dataArray = [];
        //let n = 0;
        dataArray = [];
        let lastTick;
        let dataReady = false;

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
                    console.log(`break on tickdiff = ${tickdiff}`)
                    bitstream.destroy();
                    break
                };

                let dataBit = ((level & (1 << dataPin)) != 0) ? 1 : 0;  // read data pin
                dataArray.push(dataBit);

                if (debug) console.log(`GPIO6 = ${dataBit} Seqno = ${seqno} Tickdiff = ${tickdiff} Bitcount: ${dataArray.length}`);
                lastTick = tick;
                                
                // Probably can remove this
                // n++;
                // if (n >= 2000) {
                //     console.log("break on large n");
                //     bitstream.destroy();
                //     break;
                // }        

            }
        });

        bitstream.on('close', (data) => {
            if (debug) console.log(`closing notifier...`);
            notifier.close();
            if (debug) console.log(`returning [${dataArray.join('')}]`)
            resolve(dataArray);
        });
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