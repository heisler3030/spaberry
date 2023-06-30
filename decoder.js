const Config = require('./config');
const debug = Config.debug

module.exports.decodeDisplay = (dataArray) => {

    // Pass in a 76-bit binary array and get back a status object

    dataString = dataArray.join('')

    let displayBits = dataString.substring(1,29) // 4x 7-bit digits, with first bit ignored
    let display = _decodeDigits(displayBits)
    let temperature = _convertTemp(display)
    
    const displayStatus = {
        bits: dataString,
        display: display.join('').trim(),
        setHeat: _getBit(dataArray, 41),
        mode: _getBit(dataArray, 60),
        heating: _getBit(dataArray, 40),
        tempUp: _getBit(dataArray, 30),   // display is in temp Up mode
        tempDown: _getBit(dataArray, 39), // display is in temp Down mode
        blower: _getBit(dataArray, 43),
        pump: _getBit(dataArray, 49),
        jets: _getBit(dataArray, 50),
        light: _getBit(dataArray, 48),
        temperature: temperature  
    }

    return displayStatus

}

function _getBit(array, bit) {
    return parseInt(array[bit-1]);
}

function _decodeDigits(bits) {

    // look up all 4 display digits in the table, for both normal and inverted orientation
    // in at least one case (F, C, L, 1) it will return a ? when inverted - this is the 'wrong' orientation
    // Whichever one has ?s is the 'wrong' one
    // Least-significant digit comes first (when display not inverted)

    let display = [
        _digitMap[bits.slice(21,28)] || "?",
        _digitMap[bits.slice(14,21)] || "?",
        _digitMap[bits.slice(7,14)] || "?",
        _digitMap[bits.slice(0,7)] || "?"
    ]

    let inverted = [
        _invertedDigitMap[bits.slice(0,7)] || "?",
        _invertedDigitMap[bits.slice(7,14)] || "?",
        _invertedDigitMap[bits.slice(14,21)] || "?",
        _invertedDigitMap[bits.slice(21,28)] || "?"
    ]

    if (debug) {
        console.log(`digit1: ${bits.slice(0,7)} digit2: ${bits.slice(7,14)} digit3: ${bits.slice(14,21)} digit4: ${bits.slice(21,28)}`)
        console.log(`display:${display} inverted:${inverted}`)
    }

    if (display.includes("?")) {
        return inverted
    } else return display

}

function _convertTemp(display) {
    let digits = display.slice(0,3).join('')
    let tempString = parseInt(digits)
    if (tempString == NaN) { // Likely 'C00L' or '0n'
        return 60 
    } else return tempString
}

const _digitMap = {
    "0000000":" ",
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
    "1000111":"F",
    "1001110":"C",
    "0001110":"L",
    "0010101":"n",
    "0110111":"H",
    "1001111":"E"
}

const _invertedDigitMap = {
    "0000000":" ",
    "1111110":"0", // as string to prevent evaluation to 'false'
    "0000110":1,
    "1101101":2,
    "1001111":3,
    "0010111":4,
    "1011011":5,
    "1111011":6,
    "0001110":7,
    "1111111":8,
    "0011111":9,
    "0111001":"F",
    "1111000":"C",
    "1110000":"L",
    "0100011":"n",
    "0110111":"H",
    "1111001":"E"
}