// Mixology Prototype
// WebRTC Signaling server 1.1
//
// Copyright (C) 2014 Gearcloud Labs. All Rights Reserved
//
// SDK MODEL
//
// TODO:
// - mNodeName should be case insensitive?
// - Output to multiple named slots? Sorta works.. find the bug

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var http = require('http');

// Main program
//

var _PORT       = 9090;
var _LOG_LEVEL  = 1;
var _DEBUG_MODE = true;
var _WEBDIR     = "/html";
// var _WEBDIR     = "/html1";
var _VERSION    = "0.1";

var _channels = new Object();  // manifest format in mixology.js;  [channelName]
var _registrations = new Object(); // [channelName][fqmNodeName] = {"FQN.port":true, .. }
var _mNodeIndex = new Object(); // mNodes index for partioning



function main() {

    io.set('log level', _LOG_LEVEL);

    if (process.argv[2]) {
	_PORT = process.argv[2];
    }

    server.listen(_PORT);

    // Fire up a web server to serve static files
    // note - socket.io will intercep and serve files under URI: http://<host>/socket.io/*

    //    app.use(compression({filter: function (req,res) {
    //		    return /json|text|javascript|dart|image\/svg\+xml|application\/x-font-ttf|application\/vnd\.ms-opentype|application\/vnd\.ms-fontobject|application\/octet-stream/.test(res.getHeader('Content-Type'));


		    //		}}));
		

//    app.use(express.static(__dirname+_WEBDIR,{maxAge:86400000}));  // send cache-header
    app.use(express.static(__dirname+_WEBDIR));

    log("Server v"+_VERSION+" started on port "+_PORT+" Root Directory: "+_WEBDIR);

    // Accept socket connections
    //

    io.sockets.on('connection', function (socket) {


	    var channelName; // channel Name (w/partition #)
	    var channelNameRoot; // base channel name (without partion #)
	    var channelURL;
	    var mNodeName; // mNode that we are serving
	    var fqmNodeName; // fully qualified (includes Sid)
	    var inputs;
	    var outputs;
	    var topology; // [{src:A.x, sink:B.y},..]   A.x sends to B.y


	    // Broadcast message to all registered peers
	    //

	    function broadcastToPeers(event, payload) {
		// for each slot, get peer


	    }

	    // Notify peers

	    function notifyRegisteredPeers(event){

		var slots = _registrations[channelName][fqmNodeName];
		var ps = new Array();
		for (var i in slots) {
		    var slot = slots[i];
		    //		    log("getting peers for: "+slot);
		    
		    var p = peersForSlot(slot);
		    for (var j in p) {
			// send me to each item

			var apeer = p[j].peer;
			var dir   = p[j].direction;
			var sid   = p[j].peer.split(".")[1];
			
			if (sid != slot.split(".")[1]) {
			    // ignore loopbacks, as they'll come back in initial registration
			    
			    var payload = {peer:slot, me:apeer, direction: dir=="in"?"out":"in"};

			    socket.broadcast.to(sid).emit(event,payload);
			    //			    io.sockets.socket[sid].emit(event, payload);
			    log(" "+sid+":notifyRegisteredPeers: "+slot+" -> " + apeer + " payload: "+JSON.stringify(payload,null,2));
			    
			    ps.push(p[j]);
			}
		    }
		}
		return ps;
	    }

	    // Get all registered peers
	    //
	    function allRegisteredPeers(){
		// for each my slots, call peersForSlot
		var slots = _registrations[channelName][fqmNodeName];
		var ps = new Array();
		for (var i in slots) {
		    var slot = slots[i];
		    
		    var p = peersForSlot(slot);
		    for (var j in p) {
			ps.push(p[j]);
		    }
		}
		return ps;

	    }

	    // Get connected mNode's peers for given slot (input or output)
	    // fully qualified names
	    //

	    function peersForSlot(fqSlotName) {
		// find peer from topology
		// look up fully qualified name

		//		var direction;
		var parsed;
		var slotName;
		var gPeer;
		var peers = new Array();
		var direction;

		parsed = fqSlotName.split(".");
		if (parsed.length == 3) {
		    mName     = parsed[0];
		    slotName  = parsed[2];
		    gName = mName+"."+slotName; // e.g., A.x
		    
		    for (var i in topology){
			var clause = topology[i];

			if (clause["src"] == gName) {
			    gPeer = clause["sink"];
			    direction = "out";
			} else if (clause["sink"] == gName) {
			    gPeer = clause["src"];
			    direction = "in";
			}
		    }

		    if (gPeer) {
			

			//log("gPeer for:" + fqSlotName + " is: " + gPeer + " ("+direction+")");

			// now find all registered peers
			var peerName = gPeer.split(".")[0];
			var peerPort = gPeer.split(".")[1];

			mNodes = Object.keys(_registrations[channelName]);

			for (var i in mNodes) {
			    var p = mNodes[i].split(".")[0];
			    if (p == peerName) {
				peers.push({peer:mNodes[i]+"."+peerPort, me:fqSlotName, direction:direction});
			    }
			}

		    } else {
			log(" Error. mNode '"+mNodeName+"' registration doesn't match topology - slot: "+fqSlotName+" dangling.");
		    }
		    
		} else {
		    log("ERROR: malformed slotname: "+ fqSlotName);
		}

		return peers;
	    }

	    log("CONNECTED: "+socket.id);

	    // EVENTS

	    // Register: {mNodeURL:<> ,inputs:[], outputs:[]}
	    socket.on('register', function(data) {

		    log('REGISTER received:'+JSON.stringify(data,null,2));

		    var mNodeURL = data.mNodeURL.split("/");
		    var host = mNodeURL[2].split(":")[0];
		    var port = mNodeURL[2].split(":")[1] ? mNodeURL[2].split(":")[1] : "80";
		    var root = mNodeURL.slice(3, mNodeURL.length-1).join("/");
		    var path = root.length ? "/" + root + "/manifest.json" : "/manifest.json";

		    // placed here so we have access to all vars in scope
		    function registerSlots() {
			if (!_registrations[channelName]) _registrations[channelName] = new Object();
			_registrations[channelName][fqmNodeName] = new Array(); // Object?

			//var slots = new Array();
			//for (var i in inputs) slots.push("in."+inputs[i]);
			//for (var i in outputs) slots.push("out."+outputs[i]);
			var slots = inputs.concat(outputs);

			log(" Registering ["+channelName+"]["+fqmNodeName+"]: "+slots.join(","));
			for (var i in slots) {
			    var fqslot = fqmNodeName + "." + slots[i];

			    //_registrations[channelName][fqmNodeName][fqslot] = true;
			    _registrations[channelName][fqmNodeName].push(fqslot);
			}
		    }

		    mNodeName = mNodeURL[mNodeURL.length-1].split(".")[0];
		    fqmNodeName = mNodeName+"."+socket.id;
		    channelURL = host+":"+port+"/"+root;

		    inputs = data.inputs;
		    outputs = data.outputs;

		    log(' Loading:'+channelURL);

		    var buff = '';

		    var options = {
			host : host,
			port : port,
			path : path,
			method: 'GET',
			headers: {'Content-Type':'qpplication/json'}
		    }

		    var callback = function(response) {

			response.on('data', function(chunk) { buff += chunk;});
			response.on('end', function() {

				try {
				    var cn = JSON.parse(buff);
				} catch (e) {
				    log(" .. Malformed manifest:"+buff+" ("+e+")");
				    return;
				}

				channelName = cn["channelName"];
				delete cn["channelName"]; // no need, since name is array key
				_channels[channelName] = cn;
				log(" .. Loaded Channel:"+channelName);

				// Load topology
				topology = new Array(); // 
				var clauses = cn["topology"];
				for (var i in clauses) {
				    var clause = clauses[i].split("|");
				    topology.push({src:clause[0], sink:clause[1]});
				}

				// TEST-- Partition users in a channel-- REDEFINES channelName here!****
				// Partition size is given in manifest
				//
				channelNameRoot = channelName;
				
				_mNodeIndex[channelNameRoot] = _mNodeIndex[channelNameRoot] ? _mNodeIndex[channelNameRoot] : 0; 
				_mNodeIndex[channelNameRoot] += 1;

				var partitionSize = cn["partitionSize"];

				var partition;
				
				if (partitionSize) {
				    partition = Math.ceil(_mNodeIndex[channelNameRoot] / partitionSize);
				    channelName = channelName + ":" + partition; // this partitions mNodes into groups!
				    log(" partitioned channel:"+channelName + " size:"+partitionSize);
				} else {
				    partition = 1;
				    log(" non-partitioned channel:"+channelName);				    
				}
				
				// Register slots
				registerSlots();

				//// CHECK RACES

				// tell registered peers (by topology) that I'm here
				
				// broadcastToPeers("onPeerRegistered",{fqmNodeName:fqmNodeName});

				notifyRegisteredPeers('onPeerRegistered');

				// fire callback
				
				socket.emit('onRegistered',{fqmNodeName:fqmNodeName, 
					    channelName:channelNameRoot, 
					    partition: partition,
					    registeredPeers:allRegisteredPeers()});

				// send current Peers back when you register?
				
				
				    
			    });
			}

		    var req = http.request(options, callback);
		    req.end();

		});


	    // SendtoPeer: {to:<fqmNodeName> from:<fqmNodeName>, data:{} }
	    //
	    // send to peer.  'from' is redundant..
	    //

	    socket.on('sendToPeer', function(data) {

		    var peerSid;

//		    log('SENDTOPEER received:'+JSON.stringify(data,null,2));

		    if (data.to in _registrations[channelName]) {

			peerSid = data.to.split(".")[1];
			if (data.from != fqmNodeName) {
			    log(" sendToPeer - sender mismatch: "+data.from + " != " + fqmNodeName);
			    data.from = fqmNodeName;
			}

			socket.broadcast.to(peerSid).emit('onMessage',data);
			//			io.sockets.socket(peerSid).emit('onMessage', data);
			log(" sendToPeer from: "+fqmNodeName+" to: "+data.to+" payload:"+JSON.stringify(data.data.rtcEvent));

		    } else {
			log(" sendToPeer - peer not registered: "+data.to + " sender: "+data.from);
		    }


		    /*
		    ////

		    // go find peer in table, get socket id
		    // send!
		    var fromSlot = data["fromSlot"]; 
		    var msgData  = data["data"];
		    var slotName = mNodeName + "." + fromSlot;  // X.y
		    var direction;
		    var peer;
		    var peerSid;
		    var fqSlotName;


		    // Sigh. look up my direction -- REFACTOR

		    for (var i in topology) {
			var clause = topology[i];

			if (clause['src'] == slotName) {
			    direction = "out";
			    break;
			}

			if (clause['sink'] == slotName) {
			    direction = "in";
			    break;
			}
		    }

		    if (direction) {
			fqSlotName = mNodeName + "." + peerID + "." + direction + "." + fromSlot;
			peer = peersForSlot(fqSlotName);

			// get peer's socketID (same as their ID)
			peerSid = peer.split(".")[1];

		    
			log("sendToPeer from: "+fqSlotName+" to: "+peer);
			
			// now Send!
			io.sockets.socket(peerSid).emit('onMessage', msgData);
			    
		    } else {
			log("SendtoPeer. Bad slot provided: "+slotName);
		    }
		    */

		});


	    /// Debug Utilities

	    socket.on('debug', function(data) {

		    log('DEBUG received:'+JSON.stringify(data,null,2));

		    log(" PEERS:" + JSON.stringify(peersForSlot(data), null, 2));



		    log(" ALL REGISTERED PEERS:" + JSON.stringify(allRegisteredPeers(), null, 2));

		    log(" channels:"+ JSON.stringify(_channels, null, 2));		    

		    log(" registrations:"+ JSON.stringify(_registrations, null, 2));

		    log(" topology for: " + channelName +":"+ JSON.stringify(topology, null, 2));


		});

	    socket.on('disconnect', function() {


		    // remove registrations

		    if (mNodeName) {
			log("DISCONNECT:["+channelName+"]:"+fqmNodeName+" and unregistered");
			//TBD: broadcast

			notifyRegisteredPeers('onPeerUnRegistered');

			delete _registrations[channelName][fqmNodeName];
			//  let it increase vs drop.. _mNodeIndex[channelNameRoot] -= 1;
			log(" mNodeIndex["+channelNameRoot+"]="+_mNodeIndex[channelNameRoot]);

		    } else {
			log("DISCONNECT:(Nothing registered)");
		    }
		});


	});
}

// Utilities

function log(data) {
    if (_DEBUG_MODE) {
	console.log(data);
    }
}

/// Startup!

main();

