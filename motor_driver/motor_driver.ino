/*
 Fading
 
 This example shows how to fade an LED using the analogWrite() function.
 
 The circuit:
 * LED attached from digital pin 9 to ground.
 
 Created 1 Nov 2008
 By David A. Mellis
 Modified 17 June 2009
 By Tom Igoe
 
 http://arduino.cc/en/Tutorial/Fading
 
 This example code is in the public domain.
 
 */

void setup()  { 
  // nothing happens in setup 
} 

void loop()  { 
 
     analogWrite(2, 255);
     analogWrite(4, 0);
     analogWrite(3, 20);
     analogWrite(5, 0);            
   
}


