// This is the motor controller code.
// We send PWM commands to our H-Bridges to control forward/backward motion.
// See http://arduino.cc/en/Tutorial/PWM for PWM information.
// TODO: figure out a way to jump the serial queue for emergency stop

#include "motor.h"
#include "Servo.h"

// left motor
int HighPin_left     = 9; // always keep this one high, don't need this now
int DisablePin_left  = 36; // disables the h bridges, usually keep this low
int ForwardPin_left  = 12;
int BackwardPin_left = 10;

// right motor
int HighPin_right     = 9; // always keep this one high
int DisablePin_right  = 37; // disables the h bridges, usually keep this low
int ForwardPin_right  = 6;
int BackwardPin_right = 8;

// solenoids
int repeater_1_pin = 41;
int repeater_2_pin = 42;

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
    if (Serial.available() > 2) {
        motor_iterator.run(Serial.read(), Serial.read());
        int solenoid = Serial.read();
        if (solenoid == 'a') {
            digitalWrite(repeater_1_pin, 255);
            delay(1000*1);
            analogWrite(repeater_1_pin, 0);
        } else if (solenoid == 'b') {
            analogWrite(repeater_2_pin, 255);
            delay(1000*1);
            digitalWrite(repeater_2_pin, 0);
        }
    }
}
