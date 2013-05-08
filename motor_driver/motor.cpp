#include "motor.h"
#include "Arduino.h"

Motor::Motor(int highPin, int disablePin, int forwardPin, int backwardPin) {
    highPin_ = highPin;
    disablePin_ = disablePin;
    forwardPin_ = forwardPin;
    backwardPin_ = backwardPin;

    forward_ = true;
    backward_ = false;
    num_speeds_ = 3;
    last_run_ = millis();
}

int Motor::normalize_speed_(int input) {
    // for now, have 0, 1, 2, 3, 4, 5, 6
    // TODO: make this use division instead of constants
    // 255 is 100% duty cycle
    if (input == 2 || input == 4) {
        return 85; // 255 / 3
    } else if (input == 1 || input == 5) {
        return 127; // 255 / 2
    } else if (input == 0 || input == 6) {
        return 255; // 255 / 1
    } else {
        // remember if -1 over serial, that means nothing found
        return 0;
    }
}

bool Motor::direction_(int input) {
    // determine the direction the motor should turn
    if (input >= 0 && input <=2) {
        return backward_;
    } else {
        return forward_;
    }
}

void Motor::move(int speed) {
    bool direction = direction_(speed);
    int new_speed = normalize_speed_(speed);
    // ramp up linearly
    if (millis() - last_run_ > 800) {
        // for (int i = 0; i <= new_speed; i=i+10) {
        for (int i = 0; i <= new_speed; i=i+10) { // more ramping for new motors
            if (direction == forward_) {
                analogWrite(highPin_, 255);
                analogWrite(forwardPin_, i);
                analogWrite(backwardPin_, 0);
                analogWrite(disablePin_, 0);
            } else {
                analogWrite(highPin_, 255);
                analogWrite(forwardPin_, 0);
                analogWrite(backwardPin_, i);
                analogWrite(disablePin_, 0);
            }
            delay(2); // may need to take this out
        }
    }
    // set final speed
    if (direction == forward_) {
        analogWrite(highPin_, 255);
        analogWrite(forwardPin_, new_speed);
        analogWrite(backwardPin_, 0);
        analogWrite(disablePin_, 0);
    } else {
        analogWrite(highPin_, 255);
        analogWrite(forwardPin_, 0);
        analogWrite(backwardPin_, new_speed);
        analogWrite(disablePin_, 0);
    }
    last_run_ = millis();

    // good code
    // if (direction == forward_) {
    //     analogWrite(highPin_, 255);
    //     analogWrite(forwardPin_, new_speed);
    //     analogWrite(backwardPin_, 0);
    //     analogWrite(disablePin_, 0);
    // } else {
    //     analogWrite(highPin_, 255);
    //     analogWrite(forwardPin_, 0);
    //     analogWrite(backwardPin_, new_speed);
    //     analogWrite(disablePin_, 0);
    // }
}

// see http://arduinoetcetera.blogspot.com/2011/01/classes-within-classes-initialiser.html
// for why you need to use an initializer list here
MotorIterator::MotorIterator(Motor &left_motor, Motor &right_motor, int num_milliseconds):
    left_motor_(left_motor),
    right_motor_(right_motor),
    num_milliseconds_(num_milliseconds) {
}
int MotorIterator::normalize_input_(int input) {
    // ascii conversion, only expecting 48-54 (0-6)
    return input - 48;
}
void MotorIterator::run(int left_input, int right_input) {
    left_motor_.move(normalize_input_(left_input));
    right_motor_.move(normalize_input_(right_input));
    delay(num_milliseconds_);
    // PWM will keep firing until you set it to something else, so stop after
    left_motor_.move(3);
    right_motor_.move(3);
}
