'use strict'
var reader, audioBuffer;

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', f.name, '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');
        reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                // Render thumbnail.
                console.log('Load start');
                initSound(e.target.result);


            };
        })(f);
        reader.readAsArrayBuffer(f);


    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var source;
var volumeSample = context.createGain();
var startTime = 0;
var startOffset = 0;

function playSound() {
    source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    source.connect(volumeSample);
    volumeSample.connect(context.destination);
    volumeSample.gain.value = volumeInput.value;
    startTime = context.currentTime;
    console.log('Start time:', startTime);
    console.log('Start offset:', startOffset);
    console.log('Start %:', startOffset % source.buffer);
    source.start(0, startOffset % source.buffer.duration);

}


function stopSound() {
    if (source) {
        source.stop(0);
        startOffset = 0;
        startTime = 0;
    }
}

function pauseSound() {
    if (source) {
        source.stop(0);
        startOffset += context.currentTime - startTime;

    }
}


function initSound(arrayBuffer) {
    context.decodeAudioData(arrayBuffer, function (buffer) {
        audioBuffer = buffer;
        console.log('Load end');
        var buttons = document.querySelectorAll('button');
        buttons[0].disabled = false;
        buttons[1].disabled = false;
    }, function (e) {
        console.log('Error decoding', e);
    });
}


var volumeInput = document.querySelector('input[type="range"]');
volumeInput.addEventListener('input', function (e) {
    volumeSample.gain.value = e.target.value;
});


var play = false;
var playButton = document.getElementById('play');
var stopButton = document.getElementById('stop');
function togglePlay() {
    if (!play) {
        playSound();
        playButton.innerText = "Pause";
        play = true;
    } else {
        pauseSound();
        playButton.innerText = "Play";
        play = false;
    }
}
function stopPlay() {
    stopSound();
    play = false;
    playButton.innerText = "Play";
}


playButton.addEventListener('click', function(e){
    togglePlay();
});

stopButton.addEventListener('click', function(e){
    stopPlay();
});

var WIDTH = 400;
var HEIGHT = 100;
var analyser = context.createAnalyser();
var canvas = document.getElementById('waveform');
var canvasCtx = waveform.getContext('2d');
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);


/*Waveform*/
function drawWaveform() {
    analyser.fftSize = 2048;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    function draw() {
        //var drawVisual = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();


        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;
            var y = v * HEIGHT / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        requestAnimationFrame(draw);
    }
    draw();
}
/*Spectrum*/
function drawSpectrum() {
    analyser.fftSize = 256;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        var barWidth = (WIDTH / bufferLength) * 25;
        var barHeight;
        var x = 0;
        for (var i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;

            canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

            x += barWidth + 1;
        }
    }
    draw();
}

var radios = document.getElementsByName('visualization');
function setVisualization() {
    for (var i=0; i<radios.length; i++) {
        if (radios[i].checked) {
            if (radios[i].value === 'wave') {
                drawWaveform();
            }
            if (radios[i].value === 'spectrum') {
                drawSpectrum();
            }
        }
    }
}

for (var i=0; i<radios.length; i++) {
    radios[i].addEventListener('change', function(e){
        setVisualization();
    })
}