// Note: 2 and 3 are interrupt-capable

const byte topsidePanel = 3; //was 0
const byte topsideData = 1;
const byte topsideClock = 2;
const byte boardClock = 8; //was 3
const byte boardData = 4;
const byte boardPanel = 5;
const byte ledPin = 13;

volatile byte ticks = 0;

void setup() {
  pinMode(topsideClock, INPUT);
  pinMode(boardClock, OUTPUT);
  pinMode(boardData, INPUT);
  pinMode(topsideData, OUTPUT);
  pinMode(boardPanel, OUTPUT);
  pinMode(topsidePanel, INPUT);
  pinMode(ledPin, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(topsideClock), tick, RISING);
  attachInterrupt(digitalPinToInterrupt(topsideClock), endtick, FALLING);
  attachInterrupt(digitalPinToInterrupt(topsidePanel), paneltick, RISING);
  attachInterrupt(digitalPinToInterrupt(topsidePanel), panelendtick, FALLING);
}

void loop() {
  if (ticks > 76) ticks = 0;
  digitalWrite(ledPin, HIGH); // sets the LED on
  delay(1000);                // waits for a second
  digitalWrite(ledPin, LOW);  // sets the LED off
  delay(1000);                // waits for a second  
}

void tick() {
  digitalWrite(boardClock, HIGH);
  digitalWrite(topsideData, digitalRead(boardData));
  //digitalWrite(boardPanel, digitalRead(topsidePanel));
  ticks++;
}

void endtick() {
  digitalWrite(boardClock, LOW);
  digitalWrite(topsideData, LOW);
  //digitalWrite(boardPanel, LOW);
}

void paneltick() {
  digitalWrite(boardPanel, HIGH);
}

void panelendtick() {
  digitalWrite(boardPanel, LOW);
}
