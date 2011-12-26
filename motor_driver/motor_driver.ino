// This is the motor controller code.
// We send PWM commands to our H-Bridges to control forward/backward motion.
// See http://arduino.cc/en/Tutorial/PWM for PWM information.

int mosfetHighPin = 2; // always keep this one high
int mosfetDisablePin = 4; // disables the h bridges, usually keep this low
int mosfetForwardPin = 3;
int mosfetBackwardPin = 5;

class Motor {
    int highPin_;
    int disablePin_;
    int forwardPin_;
    int backwardPin_;
    boolean forward_ = true;
    boolean backward_ = false;
    private:
        void move(int, boolean);
    public:
        void forward(int);
}
Motor::Motor(int highPin, int disablePin, int forwardPin, int backwardPin) {
    highPin_ = highPin;
    disablePin_ = disablePin;
    forwardPin_ = forwardPin;
    backwardPin_ = backwardPin_;
}
void Motor::move(int speed, boolean direction) {
    if (direction_ == forward_) {
        analogWrite(highPin_, 255);
        analogWrite(forwardPin_, speed);
        analogWrite(backwardPin_, 0);
        analogWrite(disable_, 0);
    } else {
        analogWrite(highPin_, 255);
        analogWrite(forwardPin_, 0);
        analogWrite(backwardPin_, speed);
        analogWrite(disable_, 0);
    }
}

// convenience methods
void Motor::forward(int speed) {
    move(forward_, speed);
}
void Motor::backward(int speed) {
    move(backward_, speed);
}

void setup()  {
}

void loop()  {

}
