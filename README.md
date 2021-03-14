# SpaBerry
An IoT adapter for Balboa 9800CP control board, circa 1999.

Reads and simulates the protocol of the 8-button [Balboa 51285 Deluxe Digital Control](https://spacare.com/51058BalboaSerielDeluxeTopsideControl.aspx) topside, aka VL801D, via an 8-pin RJ45 jack.  

Monitor and control set temperature and spa mode through a web-based interface.  
Combine with [homebridge-spaberry](https://github.com/heisler3030/homebridge-spaberry) module for Homekit / Siri control on Apple devices.


# Requirements

This app was built and deployed using Raspberry Pi 3 model B and Arduino Uno R3 but should be compatible with other models.  Lesser models of Pi may have insufficient performance for the signal processing.

Requires the [pigpio node library](https://github.com/fivdi/pigpio), please review the installation instructions including the installation of the base C library.

You will need to assemble a hardware setup which intercepts the RJ45 topside-to-board communications and routes them to the Raspberry Pi and Arduino GPIO pins.  A detailed log of this process and the reverse engineering of the protocol can be found here:

[SpaBerry project log](https://docs.google.com/document/d/1xuc5N6-Q7J7bQxBARYjUywhqkIFjOnh8vAHqEya5QAI/edit?usp=sharing)

![Spaberry Wiring Diagram](https://raw.githubusercontent.com/heisler3030/spaberry/main/SpaBerry.png)

# Application Mechanics

The app deploys a simple express webserver on the Pi returning JSON status and accepting commands via HTTP.

Requests for Spa status use the Pi to read a data and clock signal from the spa and decode the display.  To get the current set temperature, a button press is simulated and the display is read again.

Button presses are achieved using the Arduino which intercepts and modifies the realtime control signal between the topside and the controller board.  Currently implemented controls are temp up, temp down, and spa mode.


# Installation

The spaberry library is not a ready-to-deploy application but should be easily forked and adapted to your situation.  Key variables in the header of [comms.js](https://github.com/heisler3030/spaberry/blob/main/comms.js) and [spaberry.ino](https://github.com/heisler3030/spaberry/blob/main/spaberry.ino) should be modified to reflect the specific GPIO pinouts in use on the Arduino and Raspberry Pi.

# Potential refinements

Future adaptations of the SpaBerry app may consider using the Arduino to both read and write the signal, as it is much more capable of reading the high-speed signal than the Pi, given the simpler architecture.  This will require adapting the code to pass the data back via the USB serial interface.

# Gratitude

Special thanks to the RaspberryPi.org community for [documenting their previous efforts](https://www.raspberrypi.org/forums/viewtopic.php?t=175399) and paving he way for this project.  Hope that this project can be of similar help to future explorers.
