class Motor {
    int highPin_;
    int disablePin_;
    int forwardPin_;
    int backwardPin_;
    // encode forward and backward as true and false
    boolean forward_ = true;
    boolean backward_ = false;
    private:
        void move(int, boolean);
        int normalize_speed(int);
    public:
        void forward(int);
        void backward(int);
}

Motor::Motor(int highPin, int disablePin, int forwardPin, int backwardPin) {
    highPin_ = highPin;
    disablePin_ = disablePin;
    forwardPin_ = forwardPin;
    backwardPin_ = backwardPin;
}

int Motor:normalize_speed(int input) {
    // for now, have 0, 1, 2, 3
    // TODO: make this use division instead of constant
    // probably (number of gradations - input) / 255
    if (input == 0) {
        return 0;
    } elif (input == 1) {
        return 85; // 255 / 3
    } else if (input == 2) {
        return 127; // 255 / 2
    } else if (input == 3) {
        return 255; // 255 / 1
    } else {
        raise_exception("Unrecognized input to motor" + input);
    }

}

void Motor::move(int input, boolean direction) {
    int speed = normalize_speed(input);
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
