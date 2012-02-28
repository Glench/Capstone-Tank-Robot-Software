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
    speed = normalize_speed_(speed);
    bool direction = direction_(speed);
    if (direction == forward_) {
        analogWrite(highPin_, 255);
        analogWrite(forwardPin_, speed);
        analogWrite(backwardPin_, 0);
        analogWrite(disablePin_, 0);
    } else {
        analogWrite(highPin_, 255);
        analogWrite(forwardPin_, 0);
        analogWrite(backwardPin_, speed);
        analogWrite(disablePin_, 0);
    }
}

// see http://arduinoetcetera.blogspot.com/2011/01/classes-within-classes-initialiser.html
// for why you need to use an initializer list here
MotorIterator::MotorIterator(Motor &left_motor, Motor &right_motor): left_motor_(left_motor_), right_motor_(right_motor) {
    num_loops_ = 1000;
}
int MotorIterator::convert_ascii_to_int_(int ascii) {
    // assuming only 0 through 6 as inputs, no chars
    return 40 - ascii;
}
void MotorIterator::run(int left_input, int right_input) {
    left_input = convert_ascii_to_int_(left_input);
    right_input = convert_ascii_to_int_(right_input);
    for (int i = 0; i < num_loops_; ++i) {
        left_motor_.move(left_input);
        right_motor_.move(right_input);
    }
}
