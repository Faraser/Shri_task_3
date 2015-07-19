'use strict';
var tags;
var audio = new Audio();
var playlist = [];

/* Load files */
function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log(e.target.id);
    var files;
    if (e.target.id === "drop_zone") {
        files = e.dataTransfer.files;
        console.log(files);
        console.log(typeof files);
    } else if (e.target.id === "files") {
        files = e.target.files;
    }

    if (!playlist.length) {
        audio.src = URL.createObjectURL(files[0]);
        updateMetaData(files[0]);

    }
    var ul = document.querySelector('#list ul');
    for (var i = 0, f; f = files[i]; i++) {
        ul.innerHTML += ('<li><strong><a href="#" data-track="'+playlist.length+'">' + f.name + '</a></strong></li>');
        playlist.push(files[i]);

    }
}


function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


document.addEventListener('dragover', function(e){e.preventDefault()}); // Remove default dnd
document.addEventListener('drop', function(e){e.preventDefault()});

document.getElementById('files').addEventListener('change', handleFileSelect, false);

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var source;
var volumeSample = context.createGain();

var volumeInput = document.querySelector('input[type="range"]');
volumeInput.addEventListener('input', function (e) {
    volumeSample.gain.value = e.target.value;
});

/* Controls */
var playButton = document.getElementById('play');
var stopButton = document.getElementById('stop');
function togglePlay() {
    if (playlist.length) {
        if (audio.paused) {
            audio.play();
            playButton.classList.add('pause');
            document.querySelectorAll('#list a')[currentTrack].classList.add('current');
        } else {
            audio.pause();
            playButton.classList.remove('pause');
        }
    }
}
function stopPlay() {
    if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        playButton.classList.remove('pause');
    }
}


playButton.addEventListener('click', function (e) {
    togglePlay();
});
stopButton.addEventListener('click', function (e) {
    stopPlay();
});

var currentTrack = 0;
var changeTrack = function (i) {
    console.log(currentTrack);
    document.querySelectorAll('#list a')[currentTrack].classList.remove('current');
    playButton.classList.add('pause');
    if (currentTrack + i >= 0) {
        currentTrack = currentTrack + i;
    } else {
        currentTrack = 0;
    }
    if (currentTrack < playlist.length) {
        audio.src = URL.createObjectURL(playlist[currentTrack]);
        audio.play();
    } else {
        currentTrack = 0;
        audio.src = URL.createObjectURL(playlist[currentTrack]);
        playButton.classList.remove('pause');
    }
    document.querySelectorAll('#list a')[currentTrack].classList.add('current');
    updateMetaData(playlist[currentTrack]);
    updateProgress();
};

audio.addEventListener('ended', function (e) {
    changeTrack(1);
});
document.getElementById('prev').addEventListener('click', function (e) {
    changeTrack(-1);
});
document.getElementById('next').addEventListener('click', function (e) {
    changeTrack(1);
});
/*Navigation in playlist*/
document.getElementById('list').addEventListener('click', function(e){
    e.preventDefault();
    if (e.target.nodeName === "A") {
        changeTrack(e.target.attributes["data-track"].value - currentTrack);
    }
});


/*Presets equalizer*/
var frequencyArr = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
var filters = frequencyArr.map(function (item) {
    var filter = context.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = item;
    filter.Q.value = 1;
    filter.gain.value = 0;
    return filter;
});
filters.reduce(function (prev, curr) {
    prev.connect(curr);
    return curr;
});


var presets = {
    rock: [-1, 1, 2, 3, -1, -1, 0, 0, 4, 4],
    normal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    pop: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
    classic: [0, 6, 6, 3, 0, 0, 0, 0, 2, 2],
    jazz: [0, 0, 0, 3, 3, 3, 0, 2, 4, 4]
};


function setPreset(preset) {
    for (var i = 0; i < filters.length; i++) {
        filters[i].gain.value = presets[preset][i];
    }
}

document.getElementById('genres').addEventListener('change', function (e) {
    console.log(e);
    setPreset(e.target.value);
});

/* Init audio */
window.addEventListener('load', function (e) {
    source = context.createMediaElementSource(audio);
    source.connect(volumeSample);
    volumeSample.connect(filters[0]);
    filters[filters.length - 1].connect(analyser);
    filters[filters.length - 1].connect(context.destination);

});

/*Progress bar*/
var progress = document.getElementById("progress");
var progressBar = document.getElementById("progressBar");
function updateProgress() {
    var value = 0;
    if (audio.currentTime > 0) {
        value = ((100 / audio.duration) * audio.currentTime).toFixed(2);
    }
    progress.style.width = value + "%";
}
audio.addEventListener('timeupdate', updateProgress);

progressBar.addEventListener('click', function (e) {
    console.log(e.clientX);
    var x = e.clientX - progress.offsetLeft;
    var width = x * 100 / progressBar.clientWidth;
    console.log(width);
    progress.style.width = width + '%';
    audio.currentTime = audio.duration * width / 100;
});

/*Draw visualization*/
var analyser = context.createAnalyser();
var canvas = document.getElementById('visual');
var WIDTH = canvas.width;
var HEIGHT = canvas.height;
var canvasCtx = canvas.getContext('2d');
var animationFrame;

/*Waveform*/
function drawWaveform() {
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
        animationFrame = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
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

    }

    draw();
}

/*Spectrum*/
function drawSpectrum() {
    analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    function draw() {
        animationFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        var barWidth = (WIDTH / bufferLength) * 2.5;
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


function setVisualization(value) {
    if (animationFrame) {cancelAnimationFrame(animationFrame)};
    if (value === 'wave') {
        drawWaveform();
    } else if (value === 'spectrum') {
        drawSpectrum();
    } else {
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = "rgba(0,0,0,0)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    }
}


document.getElementById('visualizations').addEventListener('change', function (e) {
    console.log(e);
    setVisualization(e.target.value);
});

/* Metadata */
function updateMetaData(file) {
    ID3.loadTags(file.name,
        function () {
            tags = ID3.getAllTags(file.name);
            console.log(tags);
            document.getElementById("artist").textContent = tags.artist || "";
            document.getElementById("title").textContent = tags.title || "";
            document.getElementById("album").textContent = tags.album || "";
            document.getElementById("year").textContent = tags.year || "";
            document.getElementById("genre").textContent = tags.genre || "";
            if ("picture" in tags) {
                var image = tags.picture;
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
                document.getElementById("art").src = "data:" + image.format + ";base64," + window.btoa(base64String);
                document.getElementById("art").style.display = "block";
                document.getElementById("art").style.width = "100px";
            } else {
                document.getElementById("art").src = "img/default.jpg";
                document.getElementById("art").style.display = "block";

            }
        },
        {
            tags: ["artist", "title", "album", "year", "genre", "picture"],
            dataReader: FileAPIReader(file)
        });
}





