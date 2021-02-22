#include <digitalWriteFast.h>

// Note: 2 and 3 are interrupt-capable
#define data 1
#define clock 2
#define controlIn 3
#define controlOut 4

const byte ledPin = 13;

volatile byte ticks = 0;
volatile bool LED_State = true;
volatile int controlLevel = 0;

void setup() {
  pinModeFast(ledPin, OUTPUT);
  digitalWriteFast(ledPin, LOW);

  pinModeFast(data, INPUT);
  pinModeFast(clock, INPUT);
  pinModeFast(controlIn, INPUT);
  pinModeFast(controlOut, OUTPUT);

  digitalWriteFast(controlOut, LOW);  // Set controlOut to low as starting point
  // Await a HIGH on controlIn
  while(digitalReadFast(controlIn) != HIGH) {
    digitalWrite(ledPin, HIGH); // sets the LED on
    delay(1000);                // waits for a second
    digitalWrite(ledPin, LOW);  // sets the LED off
    delay(1000);                // waits for a second  
  }

  attachInterrupt(digitalPinToInterrupt(controlIn), bangControl, CHANGE);  
  attachInterrupt(clock, tick, RISING);




  //digitalWriteFast(controlOut, digitalReadFast(controlIn));  // Set controlOut to whatever the controlIn is to start



}

void loop() {
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
  ticks++;
  // If time since last tick > 5ms then ticks = 0;
}

void bangControl() {
  controlLevel = digitalReadFast(controlIn);

  // If there is a remote command
  //   case ticks
  //     73 then push bit 1 of command
  //     74 then push bit 2 of command
  //     75 then push bit 3 of command
  //     76 then push bit 4 of command
  //        and clear command
  // Else

  digitalWriteFast(controlOut, controlLevel);
}