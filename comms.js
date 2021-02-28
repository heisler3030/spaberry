const Gpio = require('pigpio').Gpio;
const Notifier = require('pigpio').Notifier;
const Config = require('./config');
const debug = true
//const debug = Config.debug;

const clockPin = 5;  // pin with clock signal from board
const dataPin = 6; // pin with communications from board to display
const controlPin = 13; // pin with communications from panel to board
let tickThreshold = 5000; // minimum microseconds of clock silence

// const clock = new Gpio(clockPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const data = new Gpio(dataPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});
// const control = new Gpio(controlPin, {mode: Gpio.INPUT, edge: Gpio.RISING_EDGE});

module.exports.readData = () => {
    return new Promise((resolve, reject) => {
        let notifier = new Notifier() // idle notifier
        let lastTick;
        let dataReady = false;
        let dataArray = []
        let controlsArray = []

        notifier.name = Date.now().toString(36) + Math.random().toString(36).substring(2);

        if (debug) console.log(`starting notifier... ${notifier.name}`);

        notifier.start(1 << clockPin) // notify on changes to the clockPin (bitwise)
        bitstream = notifier.stream();


        bitstream.on('data', (buf) => {
            if (debug) console.log(`inbound data received`);

            for (let ix = 0; ix < buf.length; ix += Notifier.NOTIFICATION_LENGTH) {
                if(debug) console.log(`Loop: ix = ${ix} with dataArray.length = ${dataArray.length}, not: ${notifier.name}`)
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
                    if (debug) console.log(`break on tickdiff = ${tickdiff} with dataArray.length = ${dataArray.length}, notifier: ${notifier.name}`)
                    bitstream.destroy();
                    dataReady = false
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
            if (debug) console.log(`closing notifier... ${notifier.name}`);
            notifier.close();
            if (debug) console.log(`returning [${dataArray.join('')}] notifier: ${notifier.name}`)
            resolve(
                {
                    dataArray: dataArray,
                    controlsArray: controlsArray
                }
            );
        });
    })
}