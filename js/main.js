var reader, audioBuffer;

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
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
//var source = context.createBufferSource(); // creates a sound source
var source;
var volumeSample = context.createGain();
var startTime = 0;
var startOffset = 0;

function playSound() {
    source = context.createBufferSource();
    source.buffer = audioBuffer;
    //source.connect(context.destination);
    source.connect(volumeSample);
    volumeSample.connect(context.destination);
    volumeSample.gain.value = range.value;
    startTime = context.currentTime;
    console.log('Start time:', startTime);
    console.log('Start offset:', startOffset);
    console.log('Start %:', startOffset % source.buffer);
    source.start(0, startOffset % source.buffer.duration);

}


function stopSound() {
    if (source) {
        //startTime = context.currentTime;
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


var range = document.querySelector('input[type="range"]')
range.addEventListener('input', function(e){
    volumeSample.gain.value = e.target.value;
});