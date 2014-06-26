Mixology
========

The Mixology digital media platform provides a simple way to combine multiple live video streams with interactive graphics.  It's built on top of WebRTC, and is a good choice for web apps that will run in the Chrome and/or Firefox browsers.  Mixology was created by [Gearcloud Labs](www.gearcloudlabs.com) in 2014.

Getting started
---------------
1. Download the code
2. Install node, then the following packages
   - npm install express (version 4.4.4 or later)
   - npm install socket.io   (version 1.0.6 or later)
3. Install the Mixmit Chrome Extension 
   - Open the chrome://extensions page
   - Enable developer mode
   - Load the unpacked extension "Mixmit" in the Mixology distribution
4. Start the Mixology server
   - node server.js
5. Open http://localhost:9090/ to see the list of available demos

Example code
------------
This repository currently has 3 example programs.

1. Hello - A simple hello world program with 2 nodes, and a one-way video stream connection
2. Controls - 2 nodes, with one-way video and data channel
3. Mix - 3 nodes, mixing two video sources with effects to a viewer


A more sophisticated example app is the [Party Bus](http://mixology.gearcloudlabs.com/partybus/mixer3d.html) (not currently available in an open source example).  For more information on Party Bus, see [website] (http://gearcloudlabs.com/exploring-mixology-by-riding-the-party-bus/) of Gearcloud Labs, or [article](https://hacks.mozilla.org/2014/04/inside-the-party-bus-building-a-web-app-with-multiple-live-video-streams-interactive-graphics/) in Mozilla Hacks.

Mixology Topologies
-------------------

For more information on to create your own mixes, please see the main project page at LIRPA

For more info
-------------
Contributions are welcome.  For more information, contact info@gearcloudlabs.com. 

License
-------------
Mixology is an open source library licensed under terms of the MIT License. Please see the 
LICENSE.txt file for more information