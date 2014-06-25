// === Button handlers ================================================

// effects buttons

// Normal
document.getElementById("normal").addEventListener('click', function() {
    console.log("Normal pressed");

    // send the event
    for (var id in m.outputs) {
       m.sendRtcMessage(id, "normal");
    }

    // update local display
    options.pop();

    document.getElementById("red").style.webkitFilter = 'invert(0%)';
    document.getElementById("green").style.webkitFilter = 'invert(0%)';
    document.getElementById("blue").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorh").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorv").style.webkitFilter = 'invert(0%)';
    document.getElementById("fliph").style.webkitFilter = 'invert(0%)';
    document.getElementById("flipv").style.webkitFilter = 'invert(0%)';

    this.style.webkitFilter = 'invert(100%)';
});

// Red
document.getElementById("red").addEventListener('click', function() {
    console.log("Red pressed");

    // send the event
    for (var id in m.outputs) {
        m.sendRtcMessage(id, "red");
    }

    // update local display
    options.pop();
    options.push("red");

    document.getElementById("normal").style.webkitFilter = 'invert(0%)';

    document.getElementById("green").style.webkitFilter = 'invert(0%)';
    document.getElementById("blue").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorh").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorv").style.webkitFilter = 'invert(0%)';
    document.getElementById("fliph").style.webkitFilter = 'invert(0%)';
    document.getElementById("flipv").style.webkitFilter = 'invert(0%)';

    this.style.webkitFilter = 'invert(100%)';
});

// Green
document.getElementById("green").addEventListener('click', function() {
    console.log("Green pressed");

    // send the event
    for (var id in m.outputs) {
        m.sendRtcMessage(id, "green");
    }

    // update local display
    options.pop();
    options.push("green");

    document.getElementById("normal").style.webkitFilter = 'invert(0%)';
    document.getElementById("red").style.webkitFilter = 'invert(0%)';

    document.getElementById("blue").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorh").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorv").style.webkitFilter = 'invert(0%)';
    document.getElementById("fliph").style.webkitFilter = 'invert(0%)';
    document.getElementById("flipv").style.webkitFilter = 'invert(0%)';

    this.style.webkitFilter = 'invert(100%)';
});

// Blue
document.getElementById("blue").addEventListener('click', function() {
    console.log("Blue pressed");

    // send the event
    for (var id in m.outputs) {
        m.sendRtcMessage(id, "blue");
    }

    // update local display
    options.pop();
    options.push("blue");

    document.getElementById("normal").style.webkitFilter = 'invert(0%)';
    document.getElementById("red").style.webkitFilter = 'invert(0%)';
    document.getElementById("green").style.webkitFilter = 'invert(0%)';

    document.getElementById("mirrorh").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorv").style.webkitFilter = 'invert(0%)';
    document.getElementById("fliph").style.webkitFilter = 'invert(0%)';
    document.getElementById("flipv").style.webkitFilter = 'invert(0%)';
    this.style.webkitFilter = 'invert(100%)';
});

// Mirror horizontal
document.getElementById("mirrorh").addEventListener('click', function() {
    console.log("Mirrorh pressed");

    // send the event
    for (var id in m.outputs) {
        m.sendRtcMessage(id, "mirrorh");
    }

    // update local display
    options.pop();
    options.push("mirrorh");

    document.getElementById("normal").style.webkitFilter = 'invert(0%)';
    document.getElementById("red").style.webkitFilter = 'invert(0%)';
    document.getElementById("green").style.webkitFilter = 'invert(0%)';
    document.getElementById("blue").style.webkitFilter = 'invert(0%)';

    document.getElementById("mirrorv").style.webkitFilter = 'invert(0%)';
    document.getElementById("fliph").style.webkitFilter = 'invert(0%)';
    document.getElementById("flipv").style.webkitFilter = 'invert(0%)';
    this.style.webkitFilter = 'invert(100%)';
});

// Mirror vertical
document.getElementById("mirrorv").addEventListener('click', function() {
    console.log("Mirrorv pressed");

    // send the event
    for (var id in m.outputs) {
        m.sendRtcMessage(id, "mirrorv");
    }

    // update local display
    options.pop();
    options.push("mirrorv");

    document.getElementById("normal").style.webkitFilter = 'invert(0%)';
    document.getElementById("red").style.webkitFilter = 'invert(0%)';
    document.getElementById("green").style.webkitFilter = 'invert(0%)';
    document.getElementById("blue").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorh").style.webkitFilter = 'invert(0%)';

    document.getElementById("fliph").style.webkitFilter = 'invert(0%)';
    document.getElementById("flipv").style.webkitFilter = 'invert(0%)';
    this.style.webkitFilter = 'invert(100%)';
});

// Flip horizontal
document.getElementById("fliph").addEventListener('click', function() {
    console.log("Fliph pressed");

    // send the event
    for (var id in m.outputs) {
        m.sendRtcMessage(id, "fliph");
    }

    // update local display
    options.pop();
    options.push("fliph");

    document.getElementById("normal").style.webkitFilter = 'invert(0%)';
    document.getElementById("red").style.webkitFilter = 'invert(0%)';
    document.getElementById("green").style.webkitFilter = 'invert(0%)';
    document.getElementById("blue").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorh").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorv").style.webkitFilter = 'invert(0%)';

    document.getElementById("flipv").style.webkitFilter = 'invert(0%)';
    this.style.webkitFilter = 'invert(100%)';
});

// Flip vertical
document.getElementById("flipv").addEventListener('click', function() {
    console.log("Flipv pressed");

    // send the event
    for (var id in m.outputs) {
        m.sendRtcMessage(id, "flipv");
    }

    // update local display
    options.pop();
    options.push("flipv");

    document.getElementById("normal").style.webkitFilter = 'invert(0%)';
    document.getElementById("red").style.webkitFilter = 'invert(0%)';
    document.getElementById("green").style.webkitFilter = 'invert(0%)';
    document.getElementById("blue").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorh").style.webkitFilter = 'invert(0%)';
    document.getElementById("mirrorv").style.webkitFilter = 'invert(0%)';
    document.getElementById("fliph").style.webkitFilter = 'invert(0%)';

    this.style.webkitFilter = 'invert(100%)';
});

// Pause
document.getElementById("pause").addEventListener('click', function() {
    console.log("Pause pressed");

    if (pause) {
	video.pause();
        for (var id in m.outputs) {
            m.sendRtcMessage(id, "pause cam");
        }
        this.style.webkitFilter = 'invert(100%)';
        this.textContent = "resume cam";
    }
    else {
	video.play();
        for (var id in m.outputs) {
            m.sendRtcMessage(id, "resume cam");
        }
        this.style.webkitFilter = 'invert(0%)';
        this.textContent = "pause cam";
    }
    pause = !pause;
});

// About button
document.getElementById("about").addEventListener('click', function(event) {
    console.log("About pressed");
    document.getElementById('openModal').classList.add("modalDialogOpen");
});
