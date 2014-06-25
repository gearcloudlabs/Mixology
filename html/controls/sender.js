// ===================================================================
//
// Mixology example: SENDER
// Gearcloud Labs, 2014
//
// Main parts
//    mNode code (ie, WebRTC setup via Mixology)
//
// Video effects
//     Photo booth - Colors and reflections; see effects.js
//     Pause/resume video
//
// To run
//     localhost:9090/controls/sender.html
//
// ===================================================================

// === Video inits ===================================================

var video = document.createElement('video');
var feed = document.createElement('canvas');
var display = document.createElement('canvas');

video.style.display = 'none';
feed.style.display = 'none';

feed.width = 640;
feed.height = 480;

display.width = 640;
display.height = 480;

document.body.appendChild(video);
document.body.appendChild(feed);
document.body.appendChild(display);

var options = [];     // array for visual effect options


// === Mixology initialization ========================================

var CONFIG = {
    'iceServers': [ {'url': 'stun:stun.l.google.com:19302' } ] 
};

var RTC_OPTIONS = { 
    optional:[{RtpDataChannels: true}]
	};

var SDP_CONSTRAINTS = {'mandatory': {
	'OfferToReceiveAudio':true,
	'OfferToReceiveVideo':true }};

var VIDEO_CONSTRAINTS = {
    mandatory: {
	maxWidth:640,
	maxHeight:480
    },
    optional:[]
};

signaller = document.URL.split('/').slice(0,3).join('/');
var stream;    // my camera stream
var m = new Mixology(signaller);
var myPeerId;


m.onRegistered = function(peer) {
    console.log("onRegistered:"+ JSON.stringify(peer,null,2));
    myPeerId = peer.fqmNodeName;

    for (var pid in m.inputs) {
	// receiveRtcStream starts dance immediately
	// to throttle we'd need a handshake before this

	// DATA CHANNEL: onMessage enables data channel
	m.receiveRtcStream(pid, CONFIG, onAddStream, onRtcMessage, onRtcDataUp);
    }

    for (var pid in m.outputs) {
	// sendRtcStream starts dance immediately
	// to throttle we'd need a handshake before this

	m.sendRtcStream(pid, stream, CONFIG, onRtcMessage, onRtcDataUp, RTC_OPTIONS);
	// m.sendRtcStream(pid, stream, CONFIG);
    }
};


m.onPeerRegistered = function(peer) {
    console.log("onPeerRegistered:"+JSON.stringify(peer,null,2));

    if (peer.direction == "out") {
	if (stream) {
	    // sendRtcStream starts dance immediately
	    // to throttle we'd need a handshake before this

	    m.sendRtcStream(peer.peer, stream, CONFIG, onRtcMessage, onRtcDataUp);
	}
    }

    if (peer.direction == "in") {
	// receiveRtcStream starts dance immediately
	// to throttle we'd need a handshake before this

        // DATA CHANNEL: onMessage enables data channel
	m.receiveRtcStream(peer.peer, CONFIG, onAddStream, onRtcMessage, onRtcDataUp);
    }
};


m.onPeerUnRegistered = function(peer) {
    console.log("onPeerUnRegistered:"+JSON.stringify(peer,null,2));
    m.closeRtcStream(peer.peer);

};


m.onMessage = function(d) {
    console.log("onMessage:"+JSON.stringify(d,null,2));
    if (d.data.rtcEvent) {
	m.processRtcEvent(d.data, SDP_CONSTRAINTS);
    }
};


function onAddStream(stream, peerId) {
    console.log("onAddStream called for "+peerId);
}


function onRtcDataUp(peerId) {
    console.log("RtcData connection up. Peer:"+peerId);
    //    m.sendRtcMessage(peerId, "Hello from "+m.fqmNodeName);
}    


function onRtcMessage(from, msg) {
    console.log("Got RTC Message from:"+from+":"+msg.data);
}


// === Sender code ===================================================================

function getLocalCam() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    if (!navigator.getUserMedia) {
	console.log("navigator.getUserMedia() is not available");
	// to do: tell user too
    }
    else {
	navigator.getUserMedia({audio: false, video: VIDEO_CONSTRAINTS}, function(strm) {
	
	    stream = strm; // save stream because other peers will use it too

	    // initialize some stuff, only if user accepts use of webcam
	    document.getElementById("controls").style.visibility = "visible";

	    // mark camera ready, and check model + audio
	    console.log("Camera ready");

	    // Register with Mixology server
	    m.register([], ['out']);                       // sender, out

	    video.src = window.URL.createObjectURL(strm);  // Chrome and Firefox
	    // video.src = stream;                         // Opera, not tested
	    video.autoplay = true;                         // probably not needed

	    streamFeed();   	                           // start video

	}, function(err) {
	    console.log("GetUserMedia error:"+JSON.stringify(err,null,2));
	});
    }
}


function streamFeed() {
    requestAnimationFrame(streamFeed);

    var feedContext = feed.getContext('2d');
    var displayContext = display.getContext('2d');
    var imageData;

    feedContext.drawImage(video, 0, 0, display.width, display.height);
    imageData = feedContext.getImageData(0, 0, display.width, display.height);

    // add effects
    imageData = addEffects(imageData, feed.width, feed.height);
    displayContext.putImageData(imageData, 0, 0);

    update();
}


// pause and resume video
function update() {
    // pause
    if ( keyboard.pressed("p") )
	video.pause();

    // resume
    if ( keyboard.pressed("r") )
	video.play();

    // controls.update();
    // stats.update();
}




//
// BROWSER & WEBGL DETECTION
//
var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
var isFirefox = /Firefox/.test(navigator.userAgent);
var isMac = /Mac OS/.test(navigator.userAgent);
var supportsWebGL = function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } };

if (isChrome) {
    console.log("Detected Chrome browser");
    if (!supportsWebGL()) {
        window.location = "error.html?no-webgl";
    }
} else if (isFirefox) {
    console.log("Detected Firefox browser");
    if (!supportsWebGL()) {
        window.location = "error.html?no-webgl";
    }
}
else {
    window.location = "error.html?not-chrome";
}



// === Initialize =====================================================

// Ask user to allow use of their webcam
function initSender() {
    console.log("initSender()");
    getLocalCam();        // in turn, registers with Mixology server
}

initSender();


