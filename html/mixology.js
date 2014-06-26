// Mixology Prototype SDK
// Copyright (C) 2014 Gearcloud Labs, LLC
//
// See LICENSE file for licensing information
//
// Dependencies
//    socket.io.js
//

// Mixology class

(function () {

    // urlOverride is optional, used by proxy.
    var Mixology = function Mixology(signallerHost, urlOverride) {

	this.signallerHost = signallerHost;
	this.mNodeURL      = urlOverride ? urlOverride :document.URL;
	this.debugMode     = true;
	this.fqmNodeName;
	this.inputs  = new Object();
	this.outputs = new Object();

	var self = this; // so callbacks can see instance properties

	// set up connection to signaller and internal callbacks

	this.socket = io.connect(this.signallerHost, {'force new connection':true});

	this.socket.on('onRegistered', function(data) {
		self.fqmNodeName = data.fqmNodeName;

		var peers = data.registeredPeers;
		for (var i in peers) {
		    self.addPeer(peers[i]);
		}
		
		if (self.onRegistered) {
		    self.onRegistered(data);
		} else {
		    self.log("Warning. No callback for 'onRegistered'");
		}

	    });

	this.socket.on('onPeerRegistered', function(peer) {

		self.addPeer(peer);

		if (self.onPeerRegistered) {
		    self.onPeerRegistered(peer);
		} else {
		    self.log("Warning. No callback for 'onPeerRegistered'");
		}
	    });

	this.socket.on('onPeerUnRegistered', function(peer) {


		if (self.onPeerUnRegistered) {
		    self.onPeerUnRegistered(peer);
		} else {
		    self.log("Warning. No callback for 'onPeerUnRegistered'");
		}

		self.removePeer(peer);
	    });

	this.socket.on('onMessage', function(data) {
		if (self.onMessage) {
		    self.onMessage(data);
		} else {
		    self.log("Warning. No callback for 'onMessage'");
		}

	    });
    }
    
    
    // Register 
    //

    Mixology.prototype.register = function(inputs, outputs, callback) {

	var payload =  {
	    mNodeURL: this.mNodeURL, 
	    inputs  : inputs ? inputs : "",      // normalize
	    outputs : outputs ? outputs : "",    // normalize
	};

	this.log("Register payload:"+JSON.stringify(payload));

	this.socket.emit('register', payload);
    }

    // Send message to peer
    //

    Mixology.prototype.sendToPeer = function(toPeer, msg) {

	// allow for a peer w/slot name (strip slot)

	if (toPeer.split(".").length == 3) {
	    toPeer = toPeer.split(".").slice(0,2).join(".");
	}

	var payload = {
	    to: toPeer,
	    from: this.fqmNodeName,
	    data: msg
	}

	this.socket.emit('sendToPeer', payload);

    }

    // Close
    //

    Mixology.prototype.close = function(data) {
	this.log("CLOSE session");
	this.socket.disconnect();
    }



    // Send server a Debug msg
    //

    Mixology.prototype.debug = function(data) {
	this.socket.emit('debug',data);
    }


    // Utilities
    //

    // Log handler
    //

    Mixology.prototype.log = function(msg) {
	if (this.debugMode) {
	    console.log(msg);
	}
    }

    // Add Peer to peer table
    //

    Mixology.prototype.addPeer = function(peer) {
    // {peer:xx, direction:''}  in:(we receive); out:(we send)

	// this.log("AddPeer: "+JSON.stringify(peer,null,2));

	if (peer.direction == "in") {
	    this.inputs[peer.peer] = {me:peer.me, direction:"in"};
	} else{
	    this.outputs[peer.peer] = {me:peer.me, direction:"out"};
	}
    }

    // Remove Peer from peer table
    //

    Mixology.prototype.removePeer = function(peer) {

	this.log("RemovePeer: "+JSON.stringify(peer,null,2));

	if (peer.direction == "in") {
	    delete this.inputs[peer.peer];
	} else {
	    delete this.outputs[peer.peer];
	}
    }

    // WebRTC Helpers
    //
    // sendStream - send a webRTC stream to a registered peer
    // - peerId - fully qualifed name of peer, including slot -- fixup names!
    //
    // Parameters: peerId, stream, config [,onMessage [,options]]
    //
    // Specifying onMessage enables data stream. Specifying option allows you to tweak RTC options.
    // 

    // NEW
    function error(err) { endCall(); }

    Mixology.prototype.sendRtcStream = function(peerId, stream, config, onMessage, onOpen, options){
	var peer = this.outputs[peerId];
	var self = this;
	var options;

	if (onMessage) {
	    if (!options) {
		options = {optional:[{RtpDataChannels: true}]}
	    }
	}
	
	// NEW handle Chrome/webkit vs. Mozilla/moz
	// see http://www.webrtc.org/interop, and adapter.js
	// https://code.google.com/p/webrtc/source/browse/trunk/samples/js/base/adapter.js

	if (navigator.webkitGetUserMedia)
	    peer.rtcPc = new webkitRTCPeerConnection(config, options);
	else if (navigator.mozGetUserMedia)
	    peer.rtcPc = new mozRTCPeerConnection(config, options);
	else
	    console.log("Unknown browser on GetUserMedia, sendRtcStream()");

	peer.rtcPc.onicecandidate = function(event) {
	    // onIceCandidate handler
	    if (event.candidate) {
		var payload = {slot:peerId, fromSlot:peer.me, rtcEvent:"newICE", candidate:event.candidate};
		self.sendToPeer(peerId, payload);
	    }
	}
	peer.rtcPc.addStream(stream);

	if (onMessage) {
	    peer.rtcPc.ondatachannel = function(event){
		//this.log(" peerId:"+peerId+" ondatachannel() event");
	    };

	    try {
		peer.rtcPc.dataChannel = peer.rtcPc.createDataChannel("sendDataChannel",{reliable:false});
		this.log(" peerId:"+peerId+" data channel created.");

		peer.rtcPc.dataChannel.onopen = function() {
		    if (onOpen) {
			onOpen(peerId);
		    }
		}
		peer.rtcPc.dataChannel.onmessage = function(e) {
		    if (onMessage) {
			onMessage(peerId,e);
		    }
		}

	    } catch (e) {
		this.log(" peerId:"+peerId+" data channel barfed:"+e);
	    }
	}

	peer.rtcPc.createOffer(function(desc){
	    // gotDescription handler
	    var payload = {slot:peerId, fromSlot:peer.me, rtcEvent:"newSDP", desc:desc};
	        self.sendToPeer(peerId, payload);
		peer.rtcPc.setLocalDescription(desc);
	    },error);    

    }




    // processRtcEvent - handle an event received via sendMessage
    //
    Mixology.prototype.processRtcEvent = function(data, sdpConstraints, tweakSdp){
	var peer;
	var self = this;
	peer = this.inputs[data.fromSlot] || this.outputs[data.fromSlot]; //! bug prone. fix!

	if (peer.rtcPc){

	    if (data.rtcEvent == "newICE") {

		if (navigator.webkitGetUserMedia)
		    var rtcIceCandidate = new RTCIceCandidate(data.candidate);
		else if (navigator.mozGetUserMedia)
		    var rtcIceCandidate = new mozRTCIceCandidate(data.candidate);
		else
		    console.log("Unknown browser on RTCIdeCandidate, processRtcEvent()");

		// same logic if we are caller or callee
		peer.rtcPc.addIceCandidate(rtcIceCandidate);

	    }

	    if (data.rtcEvent == "newSDP") {
		var answerSDP = data.desc;

		if (navigator.webkitGetUserMedia)
		    var remoteSessionDescription = new RTCSessionDescription(answerSDP);
		else if (navigator.mozGetUserMedia)
		    var remoteSessionDescription = new mozRTCSessionDescription(answerSDP);
		else
		    console.log("Unknown browser on RTCSessionDescription, processRtcEvent()");

		peer.rtcPc.setRemoteDescription(remoteSessionDescription);

		if (peer.direction == "in") {
		    peer.rtcPc.createAnswer(function(desc){

			    // optionally tweak Sdp
			    if (tweakSdp) {
				desc = tweakSdp(desc);
			    }

			    peer.rtcPc.setLocalDescription(desc);
			    var payload = {slot:data.fromSlot, fromSlot:peer.me, rtcEvent:"newSDP", desc:desc};
			    self.sendToPeer(data.fromSlot, payload);
			}, error, sdpConstraints);
		}
	    }
	} else {
	    this.log(" ?ProcessEvent for peer with no RTC session");
	}
    }


    // ReceiveRtcStream helper
    //
    // Parameters: peerId, config, onAddStream [,onRtcMessage [, onRtcOpen [,RtcOptions]]
    //
    // onRtcOpen called when data link is up
    //
    // peerId is a fully qualified slot name. e.g., A.id.x
    //
    // Specifying onMessage enables data stream. Specifying option allows you to tweak RTC options.
    //
    // TODO: fixup names!

    Mixology.prototype.receiveRtcStream = function(peerId, config, onAddStream, onMessage, onOpen, options) {
	var peer = this.inputs[peerId];
	var self = this;
	var options;

	if (onMessage) {
	    if (!options) {
		options = {optional:[{RtpDataChannels: true}]}
	    }
	}

	if (navigator.webkitGetUserMedia)
	    peer.rtcPc = new webkitRTCPeerConnection(config, options);
	else if (navigator.mozGetUserMedia)
	    peer.rtcPc = new mozRTCPeerConnection(config, options);
	else
	    console.log("Unknown browser on GetUserMedia, receiveRtcStream()");

	peer.rtcPc.onicecandidate = function(event) {
	    // onIceCandidate handler
	    if (event.candidate) {
		var payload = {slot:peerId, fromSlot:peer.me, rtcEvent:"newICE", candidate:event.candidate};
		self.sendToPeer(peerId, payload);
	    }
	}
	peer.rtcPc.onaddstream = function(e) {
	    // TODO -- handle multiple streams!
	    onAddStream(e.stream, peerId);
	    //document.querySelector('video').src = webkitURL.createObjectURL(e.stream);
	}

	peer.rtcPc.onremovestream = function(e) {
	    self.log("NOTE:REMOVE STREAM EVENT"+e);
	}

	peer.rtcPc.ondatachannel = function(e) {

	    peer.rtcPc.dataChannel = e.channel;
	    peer.rtcPc.dataChannel.onmessage = function(e) {
		if (onMessage) {
		    onMessage(peerId, e);
		}
	    }
	    peer.rtcPc.dataChannel.onopen = function() {
		if (onOpen) {
		    onOpen(peerId);
		}
	    }
	}
	    
    }

    Mixology.prototype.closeRtcStream = function(peerId) {
	this.log("CLOSE RTC STREAM:"+peerId);

	var peer = this.inputs[peerId] || this.outputs[peerId];
	if (peer) {
	    peer.rtcPc.close();
	    this.log(" found and closed");
	} else {
	    this.log(" not found. ignored");
	}
    }

    Mixology.prototype.sendRtcMessage = function(peerId, message) {
	var peer = this.inputs[peerId] || this.outputs[peerId];
	if (peer) {
            try {
   	        peer.rtcPc.dataChannel.send(message);
            } catch (e) {
		this.log("SendRtcMessage error:"+e);
	    }
	} else {
	    this.log("SendRtcMessage: peer not found: "+peerId);
	}
    }

    Mixology.prototype.tweakSdp = function(sdp, regexp, insert, replace){
	var result = "";

	try {
	    lines = sdp.split('\n');
	    lines.pop(); // pop off extraneous element
	    for (var i in lines) {

		if (lines[i].search(regexp) >= 0) {
		    if (replace != undefined) {
			// replace line!
			if (replace != "") { 
			    result += replace + "\n";
			} else {} // deletes!
		    } else {
			result += lines[i] + "\n";
		    }
		    if (insert != "") {
			// emit additional line
			result += insert + "\n";
		    }
		} else {
		    result += lines[i] + "\n";
		}
	    }
	} catch(e) {
	    console.log("barfed:"+e);
	    result = sdp;
	}
	return result;
    }


    window.Mixology = Mixology;

})();
