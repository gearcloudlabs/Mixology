// Mixology Prototype SDK
// Copyright (C) 2014 Gearcloud Labs, LLC. All Rights Reserved
//
// Dependencies
//    socket.io.js
//
// todo- Use require.js.
//
// Conventions:
// 
// -Name of mNode is name of html file, e.g., <name>.html
// -Portname names an input or output port. Must be unique within the mNode
//
// -Channel descriptor (manifest.json) stored in containing directory for all mNodes for channel
//  Note: slotNames must be unique within each mNodeName
//
//  {
//   "channelName":"Taco Giblet Parade",
//   "toplogy": ["<mNodeName>.<slotName> | <mNodeName>.<slotName>", .. ]
//  }
//
// TODO: fixup var names

var CLOUD_SIGNALLER_HOST = "http://8.34.217.23:9090"; // Use this signaller if files hosted on Google App Engine
var CLOUD_HOST = "caster-gearcloud.appspot.com";

(function () {

    // urlOverride is optional, used by proxy.
    var Mixology = function Mixology(signallerHost, urlOverride) {

	this.signallerHost = signallerHost;
	this.mNodeURL      = urlOverride ? urlOverride :document.URL;
	this.debugMode     = true;
	this.fqmNodeName;
	this.inputs  = new Object();
	this.outputs = new Object();

	// override signaller if nodeURL served from CLOUD_HOST

	if (this.mNodeURL.split("/")[2].split(":")[0] == CLOUD_HOST) {
	    this.signallerHost = CLOUD_SIGNALLER_HOST;
	}

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

    Mixology.prototype.sendRtcStream = function(peerId, stream, config, onMessage, onOpen, options){
	var peer = this.outputs[peerId];
	var self = this;
	var options;

	if (onMessage) {
	    if (!options) {
		options = {optional:[{RtpDataChannels: true}]}
	    }
	}
	
	peer.rtcPc = new webkitRTCPeerConnection(config, options);
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
	    },null,null);    
    }

    // processRtcEvent - handle an event received via sendMessage
    //
    Mixology.prototype.processRtcEvent = function(data, sdpConstraints, tweakSdp){
	var peer;
	var self = this;
	peer = this.inputs[data.fromSlot] || this.outputs[data.fromSlot]; //! bug prone. fix!

	if (peer.rtcPc){

	    if (data.rtcEvent == "newICE") {
		// same logic if we are caller or callee
		peer.rtcPc.addIceCandidate(new RTCIceCandidate(data.candidate));
	    }

	    if (data.rtcEvent == "newSDP") {
		var answerSDP = data.desc;

		// add hook to tweak SDP here?

		var remoteSessionDescription = new RTCSessionDescription(answerSDP);
		peer.rtcPc.setRemoteDescription(remoteSessionDescription);

		if (peer.direction == "in") {
		    peer.rtcPc.createAnswer(function(desc){

			    //tweak here
			    if (tweakSdp) {
				desc = tweakSdp(desc);
			    }

			    peer.rtcPc.setLocalDescription(desc);
			    var payload = {slot:data.fromSlot, fromSlot:peer.me, rtcEvent:"newSDP", desc:desc};
			    self.sendToPeer(data.fromSlot, payload);
			}, null, sdpConstraints);
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

	peer.rtcPc = new webkitRTCPeerConnection(config, options);
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

/*
// TEST - NOT USED

(function () {
    var Topology = function Toplogy (t) {
	this.topology = t;
    }

    Topology.prototype.inputs = function(x) {
	// find X in topology, then get its inputs

	var t = this.topology.split("|");
	var idx = t.indexOf(x);
	var inputs;

	if (idx == -1) {
	    console.log(x + " not found in topology:" + this.topology);
	}

	inputs = t[idx-1];  // if bad index, you get undefined so it's ok

	return inputs;
    }

    Topology.prototype.outputs = function(x) {

	var t = this.topology.split("|");
	var idx = t.indexOf(x);
	var outputs;

	if (idx == -1) {
	    console.log(x + " not found in topology:" + this.topology);
	} 
	
	outputs = t[idx+1];

	return outputs;
    }

    //    window.Mixology.Topology = Topology;
    // or?
    window.Topology = Topology;

})();
*/