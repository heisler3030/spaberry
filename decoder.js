const Config = require('./config');

module.exports.decodeDisplay = (dataArray) => {

    // Pass in a 76-bit binary array and get back a status object

    dataString = dataArray.join('')

    let byte1 = dataString.substring(0,8);
    let byte2 = dataString.substring(8,16);
    let byte3 = dataString.substring(16,24);

    let digit4 = _tensMap[byte1] || "?";
    let digit3 = _onesMap[byte2] || "?";
    let digit2 = _tensMap[byte3] || "?";
    
    const displayStatus = {
        display: [digit2, digit3, digit4].join(''),
        setHeat: _getBit(dataArray, 41),
        mode: _getBit(dataArray, 60) ? "Standard" : "Economy",
        heating: _getBit(dataArray, 40) ? "ON" : "OFF",
        blower: _getBit(dataArray, 43) ? "ON" : "OFF",
        jets: _getBit(dataArray, 49) ? "ON" : "OFF",
        light: _getBit(dataArray, 48) ? "ON" : "OFF"        
    }

    if (Config.debug) console.log(`displayStatus: ${JSON.stringify(displayStatus)}`)
    return displayStatus

}

function _getBit(array, bit) {
    return parseInt(array[bit-1]);
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