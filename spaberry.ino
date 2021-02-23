#include <digitalWriteFast.h>

// Note: 2 and 3 are interrupt-capable
#define data 1
#define clock 2
#define controlIn 3
#define controlOut 4

volatile byte ticks = 0;
volatile int controlLevel = 0;
volatile unsigned long lastTick = millis();
volatile byte command = 0;

const byte ledPin = 13;
volatile bool LED_State = true;


void setup() {
  pinModeFast(ledPin, OUTPUT);
  digitalWriteFast(ledPin, LOW);
  pinModeFast(controlIn, INPUT);
  pinModeFast(controlOut, OUTPUT);
  digitalWriteFast(controlOut, LOW);  // Set controlOut to low as starting point

  // Await a HIGH on controlIn and flash the LED while waiting
  while(digitalReadFast(controlIn) != HIGH) {
    digitalWrite(ledPin, HIGH); // sets the LED on
    delay(1000);                // waits for a second
    digitalWrite(ledPin, LOW);  // sets the LED off
    delay(1000);                // waits for a second  
  }

  pinModeFast(data, INPUT);
  pinModeFast(clock, INPUT);
  // pinModeFast(controlOut, OUTPUT);
 // digitalWriteFast(controlOut, LOW);  // Set controlOut to low as starting point - won't need this once there is a pulldown in place


  // Initiate interrupt routines
  attachInterrupt(digitalPinToInterrupt(controlIn), bangControl, CHANGE);  
  attachInterrupt(digitalPinToInterrupt(clock), tick, RISING);

  digitalWriteFast(controlOut, HIGH);  // Set control high to init board


}

void loop() {
  
  // FOR TESTING ONLY
  delay(1000); // Wait 1 seconds
  command = 15; // Set command to 'true'
  //if (command) digitalWriteFast(ledPin, HIGH);  // if command is true, turn on the LED


  // if (ticks > 76) { 
  //   digitalWriteFast(ledPin, LED_State ? HIGH : LOW);
  //   LED_State = !LED_State;
  //   ticks = 0;
  // }
  // val = digitalReadFast(controlIn);
  // digitalWriteFast(controlOut, val);

  //digitalWrite(controlOut, digitalRead(controlIn));
  //delay(100);

  // digitalWrite(ledPin, LED_State ? HIGH : LOW); // sets the LED on
  // delay(1000);                // waits for a second
  // digitalWrite(ledPin, !LED_State ? HIGH : LOW);  // sets the LED off
  // delay(1000);                // waits for a second  
}

void tick() {
  digitalWriteFast(ledPin, HIGH); //FOR TESTING  
  // If time since last tick > 5ms then ticks = 0;
  if (millis() - lastTick > 5) ticks = 0;
  lastTick = millis();
  ticks++;

  // proof of concept -- press DOWN
  if (command) {
    switch (ticks) {
      case 73:
        digitalWriteFast(controlOut, HIGH);
        break;
      case 74:
        digitalWriteFast(controlOut, HIGH);
        break;
      case 75:
        digitalWriteFast(controlOut, HIGH);
        break;
      case 76:
        digitalWriteFast(controlOut, HIGH);
        command = 0;  // Clear command from memory
        digitalWriteFast(ledPin, LOW);  // FOR TESTING
    }
  }

  // If there is a remote command
  //   case ticks
  //     73 then push bit 1 of command
  //     74 then push bit 2 of command
  //     75 then push bit 3 of command
  //     76 then push bit 4 of command
  //        and clear command
  // Else

}

void bangControl() {
  controlLevel = digitalReadFast(controlIn);
  digitalWriteFast(controlOut, controlLevel);
}