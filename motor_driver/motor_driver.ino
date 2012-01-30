// This is the motor controller code.
// We send PWM commands to our H-Bridges to control forward/backward motion.
// See http://arduino.cc/en/Tutorial/PWM for PWM information.
// TODO: figure out a way to jump the serial queue for emergency stop

// left motor
int HighPin_left     = 2; // always keep this one high
int DisablePin_left  = 4; // disables the h bridges, usually keep this low
int ForwardPin_left  = 3;
int BackwardPin_left = 5;

// right motor
int HighPin_right     = 13; // always keep this one high
int DisablePin_right  = 12; // disables the h bridges, usually keep this low
int ForwardPin_right  = 11;
int BackwardPin_right = 10;


// http://arduinoetcetera.blogspot.com/2011/01/classes-within-classes-initialiser.html
// TODO: put this class in a .h file

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

void raise_exception(String message) {
    // since there are no exceptions in Arduino-land, make my own fake exception
    // to send back to the user
    Serial.println(message);
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

void setup()  {
    Serial.begin(9600);
}


Motor left_motor(HighPin_left, DisablePin_left, ForwardPin_left, BackwardPin_left);
Motor right_motor(HighPin_right, DisablePin_right, ForwardPin_right, BackwardPin_right);

int left_motor_input = 0;
int right_motor_input = 0;

void loop() {
    // only read when available
    if (Serial.available() > 0) {
        left_motor_input = Serial.read();
        right_motor_input = Serial.read();

        // TODO: probably put this logic in Motor
        if (left_motor_input > 0) {
            left_motor.forward(left_motor_input);
        } else if (left_motor_input < 0) {
            left_motor.backward(left_motor_input);
        }

        if (right_motor_input > 0) {
            right_motor.forward(right_motor_input);
        } else if (right_motor_input < 0) {
            right_motor.backward(right_motor_input);
        }
    }
}
