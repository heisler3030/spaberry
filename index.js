const Express = require('express');
const app = Express();
//const Gpio = require('onoff').Gpio;
const Gpio = require('pigpio').Gpio;

// const clock = new Gpio(5, 'in', 'rising');
// const data = new Gpio(6, 'in');
// const controls = new Gpio(13, 'in');

const clock = new Gpio(5, {mode: Gpio.INPUT, edge: Gpio.RISING});
const data = new Gpio(6, {mode: Gpio.INPUT, edge: Gpio.RISING});
const controls = new Gpio(13, {mode: Gpio.INPUT, edge: Gpio.RISING});

//let lastClock = process.hrtime.bigint();
let lastTick = 0;
let clockCount = 0;
let frameCount = 0;
let dataFrame = "";
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

clock.on('interrupt', (level,tick) => {
    if (tick > lastTick + 10000) { // if last tick was over 10ms ago
        newframe(dataFrame, clockCount);
    }
    dataFrame += data.digitalRead();
    clockCount++
    lastTick = tick;
});

function newframe(df, cc) {
    status = `${df}|${controlsFrame}|${cc} ticks|${frameCount} frames`;
    dataFrame = "";
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
    let webStatus = status.replaceAll('|', '<br>');
    res.send(`Status:  ${webStatus}`);
});

app.get('/temp', async function (req, res) {
  res.send('Temperature');
});

app.listen(process.env.PORT || 3000);
