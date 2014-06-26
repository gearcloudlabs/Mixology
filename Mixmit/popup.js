document.querySelector('#start').addEventListener('click', function(e) {
    console.log("Start!");

    var b;
    b = chrome.extension.getBackgroundPage();    

    b.capture();

    window.close();
    
});

//b = chrome.extension.getBackgroundPage();
//b.setup();



