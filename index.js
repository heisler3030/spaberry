const Express = require('express');
const app = Express();
const Gpio = require('onoff').Gpio;

const clock = new Gpio(5, 'in', 'rising');
const data = new Gpio(6, 'in');
const controls = new Gpio(13, 'in');

let lastClock = process.hrtime.bigint();
let thisClock = process.hrtime.bigint();
let clockCount = 0;
let frameCount = 0;
let dataFrame = "";
let controlsFrame = "";
let status = "";

clock.watch((err, value) => {
    if (err) {
        throw err;     
    }
    thisClock = process.hrtime.bigint();
    let dataBit = data.readSync();
    //let controlsBit = controls.readSync();
    if (thisClock > lastClock + 1e7) {
        newframe();
    }
    dataFrame += dataBit;
    //controlsFrame += controlsBit;
    clockCount++;
    lastClock = thisClock;
});

function newframe() {
    status = `${dataFrame}|${controlsFrame}|${clockCount} ticks|${frameCount} frames`;
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
