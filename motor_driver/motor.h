#ifndef Motor_h
#define Motor_h
#include "Arduino.h"
class Motor {
    // class responsible for controlling invidual motors
    int highPin_;
    int disablePin_;
    int forwardPin_;
    int backwardPin_;
    // encode forward and backward as true and false
    bool forward_; // true
    bool backward_; // false
    int num_speeds_;
    private:
        int normalize_speed_(int);
        bool direction_(int);
    public:
        void move(int);
        Motor(int, int, int, int);
};

class MotorIterator {
    // class responsible for converting input from arduino to motor commands
    public:
        MotorIterator(Motor &left_motor, Motor &right_motor, int num_milliseconds);
        void run(int, int);
    private:
        int num_milliseconds_;
        Motor left_motor_;
        Motor right_motor_;
        int normalize_input_(int);
};
#endif
