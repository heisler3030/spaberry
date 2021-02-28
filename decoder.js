const Config = require('./config');
const debug = Config.debug

module.exports.decodeDisplay = (dataArray) => {

    // Pass in a 76-bit binary array and get back a status object

    dataString = dataArray.join('')

    // substring() extracts characters from indexStart up to but not including indexEnd
    let byte1 = dataString.substring(0,7);
    let byte2 = dataString.substring(8,15);
    let byte3 = dataString.substring(15,22);

    let digit4 = _digitMap[byte1] || "?";
    let digit3 = _digitMap[byte2] || "?";
    let digit2 = _digitMap[byte3] || "?";
    let digit1 = _getBit(dataArray, 25) ? 1 : null;

    let temperature = (100 * digit1) + (10 * digit2) + (1 * digit3);
    
    const displayStatus = {
        bits: dataString,
        display: [digit1, digit2, digit3, digit4].join(''),
        setHeat: _getBit(dataArray, 41),
        mode: _getBit(dataArray, 60),
        heating: _getBit(dataArray, 40),
        blower: _getBit(dataArray, 43),
        pump: _getBit(dataArray, 49),
        jets: _getBit(dataArray, 50),
        light: _getBit(dataArray, 48),
        temperature: temperature  
    }

    if (debug) console.log(`byte1: ${byte1} byte2: ${byte2} byte3: ${byte3}`)
    if (debug) console.log(`displayStatus: ${JSON.stringify(displayStatus)}`)
    return displayStatus

}

function _getBit(array, bit) {
    return parseInt(array[bit-1]);
}

const _digitMap = {
    "1111110":"0", // as string to prevent evaluation to 'false'
    "0110000":1,
    "1101101":2,
    "1111001":3,
    "0110011":4,
    "1011011":5,
    "1011111":6,
    "1110000":7,
    "1111111":8,
    "1110011":9,
    "0100011":"F"   
}