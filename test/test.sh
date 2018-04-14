#!/bin/bash

                                
Xvfb :2 -screen 5 1024x768x8 &   # Start virtual framebuffer display
export DISPLAY=:1.5

npm run test-browser;            # Test browser code 
