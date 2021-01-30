const Config = require('./config');
const Express = require('express');
const app = Express();
const Comms = require('./comms');
const Decoder = require('./decoder');

app.get('/', async function (req, res) {
    let bits = (await Comms.readData()).join('');
    let decoded =  Decoder.decodeDisplay(bits);
    let display = decoded.display;
    let mode = decoded.mode;

    res.send(`Status:<br>${bits}<br><br>Current Temp is ${display} <br>Mode is ${mode}`);
});

app.listen(process.env.PORT || 3000);