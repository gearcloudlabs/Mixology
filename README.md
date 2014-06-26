Mixology
========

The Mixology digital media platform provides a simple way to combine multiple live video streams with interactive graphics.  It's built on top of WebRTC, and is a good choice for web apps that run in the Chrome and/or Firefox browsers.  Mixology was first developed by [Gearcloud Labs](www.gearcloudlabs.com) in 2014.

Getting started
---------------
1. Clone or download the Mixology repository to your machine
2. Install [node.js](http://nodejs.org), and then load the following packages into your Mixology directory
   - npm install express (version 4.4.4 or later)
   - npm install socket.io (version 1.0.6 or later)
3. Install the Mixmit Chrome Extension 
   - Open the chrome://extensions page
   - Enable developer mode
   - Load the unpacked extension "Mixmit" in the Mixology distribution
4. Start the Mixology server
   - node server.js
5. Open http://localhost:9090/ to see the list of available demos

Example code
------------
This repository currently has three example programs:

1. Hello - A simple hello world program with two nodes, and a one-way video stream connection
2. Controls - Two nodes, with one-way video and data channel
3. Mix3 - Three nodes, mixing two video sources with effects sent to a viewer

A more sophisticated example app is the [Party Bus](http://mixology.gearcloudlabs.com/partybus/mixer3d.html) (not currently available in an open source example).  For more info on Party Bus, see the Gearcloud Labs [website](http://gearcloudlabs.com/exploring-mixology-by-riding-the-party-bus), or the Mozilla Hacks [article](https://hacks.mozilla.org/2014/04/inside-the-party-bus-building-a-web-app-with-multiple-live-video-streams-interactive-graphics).

License
-------
Mixology is an open source library licensed under terms of the MIT License.  Please see the 
LICENSE.txt file for details.

For more info
-------------
For information on creating your own mixes, please see the [Mixology project page](http://gearcloudlabs.com/mixology-sdk-documentation).  If that's not enough, feel free to contact us at info@gearcloudlabs.com. 

All feedback, questions, and contributions welcome!


