// To upload
// ~/Applications/arduino-1.8.5/arduino --upload ~/spaberry/spaberry.ino --port /dev/ttyACM0*

#include <digitalWriteFast.h>

// Note: 2 and 3 are interrupt-capable
#define data 5
#define clock 2
#define controlIn 3
#define controlOut 4

volatile byte ticks = 0;
volatile int controlLevel = 0;
volatile unsigned long lastTick = millis();
volatile byte stagedCommand = 0;
volatile byte command = 0;
//volatile byte input;

const byte ledPin = 13;
volatile bool LED_State = true;


void setup() {
  pinModeFast(ledPin, OUTPUT);
  digitalWriteFast(ledPin, LOW);
  pinModeFast(controlIn, INPUT);
  pinModeFast(controlOut, OUTPUT);
  digitalWriteFast(controlOut, LOW);  // Set controlOut to low as starting point

// Comment out for bench testing
  // Await a HIGH on controlIn and flash the LED while waiting
  while(digitalReadFast(controlIn) != HIGH) {
    flashLed(1,1000);
  }

  pinModeFast(data, INPUT);
  pinModeFast(clock, INPUT);

  // Initiate interrupt routines
  attachInterrupt(digitalPinToInterrupt(controlIn), bangControl, CHANGE);  
  attachInterrupt(digitalPinToInterrupt(clock), tick, CHANGE);

  digitalWriteFast(controlOut, HIGH);  // Set control high to init board

  // Init Serial
  Serial.begin(115200); // Starts the serial communication
  Serial.println("hello from arduino!");

}

void loop() {

  // Listen for command on Serial
  // Each command is one byte
  // Dequeue one by one and stage to be activated on clock 0
  // On clock zero activate and move next command into staging variable
  if(Serial.available()){
      stagedCommand = Serial.read();  // Receives as byte
      flashLed(2,200);
      // Serial.print("You sent: " );
      // Serial.println(stagedCommand);
      // Serial.print(" which is ");
      // Serial.print(bitRead(stagedCommand,3));
      // Serial.print(bitRead(stagedCommand,2));
      // Serial.print(bitRead(stagedCommand,1));
      // Serial.println(bitRead(stagedCommand,0)); 
      while(stagedCommand) {}; // Wait until the command is unstaged
    }

}

void tick() {
  if (digitalReadFast(clock) == HIGH) {
    clockRising();
  } else {
    clockFalling();
  }
}

void clockRising() {
  if (millis() - lastTick > 5) {
    // Look for a 5ms pause to find the first tick
    ticks = 0;
    command = stagedCommand; // make the waiting command executable
    stagedCommand = 0; // clear the staging buffer to shift the queue forward
  }
  lastTick = millis();
  ticks++;

  if (command) {
    // For the last 4 ticks - write the respective command bit to the control line
    switch (ticks) {
      case 73:
        digitalWriteFast(controlOut, bitRead(command,3));
        break;
      case 74:
        digitalWriteFast(controlOut, bitRead(command,2));
        break;
      case 75:
        digitalWriteFast(controlOut, bitRead(command,1));
        break;
      case 76:
        digitalWriteFast(controlOut, bitRead(command,0));
    }
  }
}

void clockFalling() { // bang down
  if (command && ticks >= 73) digitalWriteFast(controlOut, LOW);
  if (command && ticks >= 76) command = 0;  // Clear command from memory
}

void bangControl() {
  controlLevel = digitalReadFast(controlIn);
  digitalWriteFast(controlOut, controlLevel);
}

void flashLed(int times, int period) {
  // Utility function to flash the LED
  for(int n=1; n<=times; n++) {
    digitalWrite(ledPin, HIGH);
    delay(period/2);
    digitalWrite(ledPin, LOW);
    delay(period/2);
  }
}
