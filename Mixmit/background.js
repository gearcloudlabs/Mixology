// Mixmit - Tabcasting Prototype
// Copyright (C) 2014 Gearcloud Labs. 
//
// NOTE: currently using a hack to kill/reload this page after
// last captured tab is closed. I think we should be able to use
// event pages instead, but page was getting unloaded (Chrome
// thinks we're idle)

// First principles
//  - Signaller is on same host as mNode's
//
// Page is streamed with a slotname of "stream" - should fix this
//


var CONFIG = {
    'iceServers': [ {'url': 'stun:stun.l.google.com:19302' } ]
};

var SDP_CONSTRAINTS = {'mandatory': {
	'OfferToReceiveAudio':true,
	'OfferToReceiveVideo':true }};


var VIDEO_CONSTRAINTS = {
    mandatory: {
        maxWidth:1280,
        maxHeight:720,
	minFrameRate:30
    }
};

var _capturedTabs = new Object();

chrome.tabs.onRemoved.addListener( function(tabId, removeInfo) {
	console.log('Tab Removed:' +tabId);

	if (tabId in _capturedTabs) {

	    var stream = _capturedTabs[tabId].stream;

	    if (stream) {

		console.log("Stopping stream: "+JSON.stringify(stream));
		stream.stop();

	    }

	    var mSession = _capturedTabs[tabId].mSession;

	    if (mSession) {
		mSession.close();
	    }

	    delete _capturedTabs[tabId];

	    // reset background page if no active capturedTabs

	    if (Object.keys(_capturedTabs).length == 0) {
		console.log("RELOAD");
		window.location.reload();
	    }

	    
	} else {
	    console.log(" (no stream associated)");
	}


    });



chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab){
	console.log('Tab updated:[' +tab.id+"]:"+tab.url);

	chrome.tabCapture.getCapturedTabs(function(ctabs){
		// see if our tab is actively beeing captured. if so, restart?
		// tbd - for re-use of an actively casted tab		
	    });
    });

chrome.tabCapture.onStatusChanged.addListener( function(info) {

	console.log("Tabcapture state changed: tabID:"+info.tabId+", status:"+info.status);

    });


function capture() {
    console.log("attempting capture..");

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

	    console.log("Capture tab URL is:" + tabs[0].url);
	    console.log("Capture tab ID is:" + tabs[0].id);

	    var myTab = tabs[0];
	    var mNodeURL = myTab.url;
	    var parsed   = mNodeURL.split("/");
	    var mNodeHost = parsed.slice(0,3).join("/");
	    var mNodeName = parsed[parsed.length-1].split(".")[0];
	    var m;

	    // register <nodename>.proxy as an output
	    
	    m = new Mixology(mNodeHost, mNodeURL);
	    _capturedTabs[myTab.id] = {mSession: m};

	    m.onRegistered = function(d) {

		console.log("onRegistered:"+ JSON.stringify(d,null,2));

		chrome.tabCapture.capture({audio:true, video:true, videoConstraints: VIDEO_CONSTRAINTS}, function(strm) {
			console.log("Got tabstream:"+strm+" id:"+myTab.id);

			if (strm) {

			    _capturedTabs[myTab.id].stream = strm;

			    for (var pid in m.outputs) {
				// sendRtcStream starts dance immediately. To
				// throttle we'd need to add a handshake before this
				console.log("==SENDRTCSTREAM "+pid);
				m.sendRtcStream(pid, strm, CONFIG);
			    }
			} else {
			    console.log(" ignored.. (null) - active already?");
			}
		    });
	    };

	    m.onPeerRegistered = function(d) {

		console.log("onPeerRegistered:"+JSON.stringify(d,null,2));

		if (d.direction == "out") {

		    var stream = _capturedTabs[myTab.id].stream;

		    if (stream) {
			// sendRtcStream starts dance immediately. To
			// throttle we'd need to add a handshake before this
			m.sendRtcStream(d.peer, stream, CONFIG);
		    }
		}
	    };

	    m.onPeerUnRegistered = function(d) {
		//    removePeer(d.peer);
		// tbd rtcCleanup
		console.log("onPeerUnRegistered:"+JSON.stringify(d,null,2));
		m.closeRtcStream(d.peer);
	    };

	    m.onMessage = function(d) {
		console.log("onMessage:"+JSON.stringify(d,null,2));
		if (d.data.rtcEvent) m.processRtcEvent(d.data, SDP_CONSTRAINTS);
	    };

	    // REGISTER ME!

	    m.register([],['stream']);


	});
}

chrome.runtime.onMessage.addListener(
				     function(request, sender, sendResponse) {
					 console.log(sender.tab ?
						     "from a content script:" + sender.tab.url :
						     "from the extension");
					 if (request.greeting == "hello")
					     sendResponse({farewell: "goodbye"});
				     });


console.log("Background Running");



