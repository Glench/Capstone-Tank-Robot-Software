#include "Motor.h"
#include "Arduino.h"
Motor::Motor(int highPin, int disablePin, int forwardPin, int backwardPin) {
    highPin_ = highPin;
    disablePin_ = disablePin;
    forwardPin_ = forwardPin;
    backwardPin_ = backwardPin;

    forward_ = true;
    backward_ = false;
}

int Motor::normalize_speed(int input) {
    // for now, have 0, 1, 2, 3
    // TODO: make this use division instead of constant
    // probably (number of gradations - input) / 255
    if (input == 0) {
        return 0;
    } else if (input == 1) {
        return 85; // 255 / 3
    } else if (input == 2) {
        return 127; // 255 / 2
    } else if (input == 3) {
        return 255; // 255 / 1
    }
}

void Motor::move(int input, bool direction) {
    int speed = normalize_speed(input);
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

// convenience methods
void Motor::forward(int speed) {
    move(forward_, speed);
}
void Motor::backward(int speed) {
    move(backward_, speed);
}
