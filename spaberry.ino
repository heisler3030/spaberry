#include <digitalWriteFast.h>

// Note: 2 and 3 are interrupt-capable
#define data 1
#define clock 2
#define controlIn 3
#define controlOut 4

const byte ledPin = 13;

volatile byte ticks = 0;
volatile bool LED_State = true;
volatile int val = 0;

void setup() {
  pinModeFast(data, INPUT);
  pinModeFast(clock, INPUT);
  pinModeFast(controlIn, INPUT);
  pinModeFast(controlOut, OUTPUT);

  // attachInterrupt(controlIn, controlUp, RISING);  
  // attachInterrupt(controlIn, controlDown, FALLING);

  //attachInterrupt(clock, tick, RISING);
  
  // attachInterrupt(digitalPinToInterrupt(controlIn), controlUp, RISING);  
  // attachInterrupt(digitalPinToInterrupt(controlIn), controlDown, FALLING);
  // attachInterrupt(digitalPinToInterrupt(controlIn), controlUp, HIGH);  
  // attachInterrupt(digitalPinToInterrupt(controlIn), controlDown, LOW);

  digitalWriteFast(controlOut, digitalReadFast(controlIn));  // Set controlOut to whatever the controlIn is to start

  pinModeFast(ledPin, OUTPUT);
  digitalWriteFast(ledPin, LOW);



}

void loop() {
  // if (ticks > 76) { 
  //   digitalWriteFast(ledPin, LED_State ? HIGH : LOW);
  //   LED_State = !LED_State;
  //   ticks = 0;
  // }
  val = digitalReadFast(controlIn);
  digitalWriteFast(controlOut, val);

  //digitalWrite(controlOut, digitalRead(controlIn));
  //delay(100);

  // digitalWrite(ledPin, LED_State ? HIGH : LOW); // sets the LED on
  // delay(1000);                // waits for a second
  // digitalWrite(ledPin, !LED_State ? HIGH : LOW);  // sets the LED off
  // delay(1000);                // waits for a second  
}

void tick() {
  ticks++;
}

void endtick() {
}

void controlUp() {
  digitalWriteFast(controlOut, HIGH);
}

void controlDown() {
  digitalWriteFast(controlOut, LOW);
}
