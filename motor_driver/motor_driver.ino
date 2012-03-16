// This is the motor controller code.
// We send PWM commands to our H-Bridges to control forward/backward motion.
// See http://arduino.cc/en/Tutorial/PWM for PWM information.
// TODO: figure out a way to jump the serial queue for emergency stop

#include "motor.h"
// #include "Servo.h"

// left motor
int HighPin_left     = 2; // always keep this one high, don't need this now
int DisablePin_left  = 4; // disables the h bridges, usually keep this low
int ForwardPin_left  = 3;
int BackwardPin_left = 5;

// right motor
int HighPin_right     = 13; // always keep this one high
int DisablePin_right  = 12; // disables the h bridges, usually keep this low
int ForwardPin_right  = 11;
int BackwardPin_right = 6;

// Servo servo;
// in setup: servo.attach(pin) servo.write(angle from 0 to 180)
void setup()  {
    Serial.begin(9600);
    // sometimes weird data on startup?
    Serial.flush();
}



Motor left_motor(HighPin_left, DisablePin_left, ForwardPin_left, BackwardPin_left);
Motor right_motor(HighPin_right, DisablePin_right, ForwardPin_right, BackwardPin_right);

int num_milliseconds = 100; // how long to run motors for, can play around with this
MotorIterator motor_iterator(left_motor, right_motor, num_milliseconds);

void loop() {
}

void serialEvent() {
    // if 2 or more bytes available, read them together
    if (Serial.available() > 1) {
        motor_iterator.run(Serial.read(), Serial.read());
    }
}
