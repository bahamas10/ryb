/* jshint browser: true */
var canvas1, canvas2, ctx1, ctx2, label, canvasimg;
var button, urlfield;
var image = new Image();

function init() {
  var elem = document.getElementById('draganddrop');
  canvas1 = document.createElement('canvas');
  canvas2 = document.createElement('canvas');
  ctx1 = canvas1.getContext('2d');
  ctx2 = canvas2.getContext('2d');
  canvasimg = document.getElementById('canvasimg');
  label = document.getElementById('label');
  button = document.getElementById('button');
  urlfield = document.getElementById('textinput');

  elem.addEventListener('dragexit', dragexit, false);
  elem.addEventListener('dragover', dragover, false);
  elem.addEventListener('dragenter', dragenter, false);
  elem.addEventListener('drop', drop, false);
}
window.onload = init;

function dragexit(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();

  var files = e.dataTransfer.files;
  if (!files.length)
    return;

  var file = files[0];
  label.textContent = 'file: ' + file.name;

  var reader = new FileReader();
  reader.onload = function(e) {
    var src = e.target.result;
    filter(src);
  };

  reader.readAsDataURL(file);
}

function filter(src) {
  image.src = src;
  image.onload = function() {
    var w = image.width;
    var h = image.height;
    canvas1.width = canvas2.width = w;
    canvas1.height = canvas2.height = h;
    ctx1.drawImage(image, 0, 0);
    makeryb();
  };
}

function makeryb() {
  var imgdata = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  var pixels = imgdata.data;

  for (var i = 0; i < pixels.length; i += 4) {
    var r = pixels[i];
    var g = pixels[i+1];
    var b = pixels[i+2];
    var a = pixels[i+3];
    var ryb = RXB.ryb2rgb([r, g, b]);
    pixels[i] = ryb[0];
    pixels[i+1] = ryb[1];
    pixels[i+2] = ryb[2];
  }

  ctx2.putImageData(imgdata, 0, 0);

  canvasimg.src = canvas2.toDataURL();
  canvasimg.height = canvas1.width;
  canvasimg.width = canvas1.height;
}

function random_magic_colors() {
  for (var i in RXB.MAGIC_COLORS) {
    for (var j = 0; j < 3; j++) {
      RXB.MAGIC_COLORS[i][j] = Math.random();
    }
  }
  makeryb();
  console.log(RXB.MAGIC_COLORS);
}
