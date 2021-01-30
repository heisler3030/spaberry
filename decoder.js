const Config = require('./config');

module.exports.decodeDisplay = (dataArray) => {

    // Pass in a 76-bit binary array and get back a status object

    let byte1 = dataArray.substring(0,8);
    let byte2 = dataArray.substring(8,16);
    let byte3 = dataArray.substring(16,24);
    
    let digit4 = _tensMap[byte1] || "?";
    let digit3 = _onesMap[byte2] || "?";
    let digit2 = _tensMap[byte3] || "?";
    
    let mode = (dataArray.substring(60,1) == 1) ? "Standard" : "Economy"; 
    
    if (Config.debug) {
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

const _onesMap = {
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

const _tensMap = {
    "11111100":8,
    "11001100":9,
    "11111001":10,
    "01000111":"F"   
}