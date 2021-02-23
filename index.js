const Config = require('./config');
const Express = require('express');
const app = Express();
const Comms = require('./comms');
const Decoder = require('./decoder');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/ttyACM0', { baudRate: 115200 });

app.get('/', async function (req, res) {
    let panelData = (await Comms.readData()).dataArray;
    let decoded =  Decoder.decodeDisplay(panelData);

    let response = `
        <html> 
            <body>
                <span>Status: ${panelData.join('')}</span><br>
                <span>Temp: ${decoded.display}</span><br>
                <span>Mode: ${decoded.mode}</span><br>
                <span>Blower: ${decoded.blower}</span><br>
                <span>Heating: ${decoded.heating}</span><br>
                <span>Jets: ${decoded.jets}</span><br>
                <span>Light: ${decoded.light}</span><br>
            </body>
        </html>
    `
    res.send(response);
});

app.get('/json', async function (req, res) {
    let panelData = (await Comms.readData()).dataArray;
    let decoded =  Decoder.decodeDisplay(panelData);
    let response = decoded
    res.send(response);
});

app.get('/command', async function (req, res) {
    let commandresult = (await Comms.sendCommand())
    res.send(commandresult);
});

app.get('/readcontrols', async function (req, res) {
    let response = "";

    for (let i=0; i< 100; i++) {
        let controlsData = (await Comms.readData()).controlsArray;
        response += `${controlsData.join('')}<br>`
    }
    res.send(response);
});

app.get('/serial', async function (req, res) {
    let commands = [15,15,15]
    console.log(`writing ${commands}`);
    port.write(commands, (err) => {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
    });
    res.send("ok");
});

app.listen(process.env.PORT || 3000);