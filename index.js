const Config = require('./config');
const Express = require('express');
const app = Express();
const Comms = require('./comms');
const Decoder = require('./decoder');
const timersPromises = require('timers/promises');
const debug = Config.debug;

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const arduino = new SerialPort('/dev/ttyACM0', { baudRate: 115200 });


app.get('/', async function (req, res) {
    let response = `
        <html> 
            <body>
                <span><a href="/mode">Mode</a></span><br>    
                <span><a href="/tempup">Temp Up</a></span><br>
                <span><a href="/tempup">Temp Down</a></span><br>
                <span><a href="/tempup">Temp Up</a></span><br>
            </body>
        </html>
    `
    res.send(response);
});

// app.get('/', async function (req, res) {
//     let panelData = (await Comms.readData()).dataArray;
//     let decoded =  Decoder.decodeDisplay(panelData);

//     let response = `
//         <html> 
//             <body>
//                 <span>Status: ${panelData.join('')}</span><br>
//                 <span>Temp: ${decoded.display ? "Standard" : "Economy"}</span><br>
//                 <span>Mode: ${decoded.mode}</span><br>
//                 <span>Blower: ${decoded.blower ? "ON" : "OFF"}</span><br>
//                 <span>Heating: ${decoded.heating ? "ON" : "OFF"}</span><br>
//                 <span>Pump: ${decoded.pump ? "ON" : "OFF"}</span><br>
//                 <span>Jets: ${decoded.jets ? "ON" : "OFF"}</span><br>
//                 <span>Light: ${decoded.light ? "ON" : "OFF"}</span><br>
//             </body>
//         </html>
//     `
//     res.send(response);
// });

app.get('/json', async function (req, res) {
    let panelData = await currentState();
    res.send(panelData);
});

// app.get('/command', async function (req, res) {
//     let commandresult = (await Comms.sendCommand())
//     res.send(commandresult);
// });

app.get('/readcontrols', async function (req, res) {
    let response = "";

    for (let i=0; i< 100; i++) {
        let controlsData = (await Comms.readData()).controlsArray;
        response += `${controlsData.join('')}<br>`
    }
    res.send(response);
});

app.get('/tempdown', async function (req, res) {
    let commands = [15,15,15]
    console.log(`writing ${commands}`);
    arduino.write(commands, (err) => {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
    });
    res.send("ok");
});

app.get('/tempup', async function (req, res) {
    let commands = [14,14,14]
    console.log(`writing ${commands}`);
    arduino.write(commands, (err) => {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
    });
    res.send("ok");
});

app.get('/mode', async function (req, res) {
    let commands = [8]
    console.log(`writing ${commands}`);
    arduino.write(commands, (err) => {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
    });
    res.send("ok");
});

app.get('/change', async function (req, res) {
    if (req.query.temp == null) throw Error ("no temp specified")
    await changeTempTo(req.query.temp);
    res.send("ok");
});

async function currentState() {
    let setTemp
    let currentTemp

    let panelData = Decoder.decodeDisplay((await Comms.readData()).dataArray);
    while (panelData.setHeat) {  // If it is already on the setHeat screen, read setTemp and wait for it to return
        setTemp = panelData.temperature
        await timersPromises.setTimeout(1000);
        panelData = Decoder.decodeDisplay((await Comms.readData()).dataArray);
    }
    currentTemp = panelData.temperature  // Now that we are not on setHeat, record the current temp
    while (!setTemp) {
        arduino.write([Config.DOWN_BUTTON]); // Send a keypress to activate the setHeat screen
        await timersPromises.setTimeout(250);
        panelData = Decoder.decodeDisplay((await Comms.readData()).dataArray);
        if (panelData.setHeat) setTemp = panelData.temperature  // Confirm setHeat screen and record setTemp
    }
    panelData.temperature = currentTemp
    panelData.setTemp = setTemp
    return panelData
}

async function changeTempTo(targetTemp) {
    if (targetTemp > Config.MAX_TEMP || targetTemp < Config.MIN_TEMP) throw new Error (`Temperature must be between ${Config.MIN_TEMP} and ${Config.MAX_TEMP}`)
    let state = await currentState();
    let currentTemp = state.setTemp
    let delta = targetTemp - currentTemp;
    let command;

    if (debug) console.log(`changeTempTo: ${targetTemp} from ${currentTemp} is ${delta}`);
    if (delta > 0) command = Config.UP_BUTTON;
    if (delta < 0) command = Config.DOWN_BUTTON;
    // if it's zero we'll deal later
    
    // for (let i=1; i<=(Math.abs(delta)+1); i++) {
    //     commands.push(command)
    // }
    // Fill an array with delta button presses to reach target temp
    let commands = new Array(Math.abs(delta)).fill(command);
    if (!state.setHeat) commands.push(command); // add one more click if it is not already in setHeat mode
    arduino.write(commands);
}

app.listen(process.env.PORT || 3000);