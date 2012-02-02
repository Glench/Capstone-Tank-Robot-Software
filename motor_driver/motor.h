#ifndef Motor_h
#define Motor_h
#include "Arduino.h"
class Motor {
    int highPin_;
    int disablePin_;
    int forwardPin_;
    int backwardPin_;
    // encode forward and backward as true and false
    bool forward_; // true
    bool backward_; // false
    private:
        void move(int, bool);
        int normalize_speed(int);
    public:
        Motor(int, int, int, int);
        void forward(int);
        void backward(int);
};
#endif
