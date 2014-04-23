// defaults
var brightness = 0;
var divisions = 12;
var divisionvariance = 1;
var isryb = true;
var lastmasktype = '';
var margin = 10;
var maskcolor = 0;
var mousedown = false;
var numneutrals = 9;
var radius = 400;
var rings = 5;
var ringvariance = 1;
var rotation = 0;
var strokecolor = '#333';
var strokecolorchoices = ['#000', '#333', '#fff'];
var strokewidth = 2;

// html elements
var advancedcontrols_div;
var brightness_range;
var colorpreview_div;
var colorpreviewneutrals_div;
var colorpreviewrgb_input;
var divisions_range;
var divisionvariance_range;
var maskcolor_range;
var maskcolor_range_text;
var prefix_input;
var rings_range;
var ringvariance_range;
var rotation_range;
var strokecolorpreviews_div;
var strokewidth_range;
var title_h1;

// svg element
var svg;

// d3 elements
var last_element_clicked;

// brightness slider
function brightness_range_oninput(t) {
  brightness_range.textContent = t.value;
  brightness = -t.value;

  // figure out the background color
  svg.selectAll('path')
    .attr('fill', function(d) {
      var d3this = d3.select(this);

      if (d3this.attr('disabled') === '1')
        return;

      var ryb = d.data.neutrals[+d3this.attr('ring')];
      var color = RXB.stepcolor(ryb, brightness / 255, 255);
      if (isryb)
        return d3.rgb.apply(d3, RXB.ryb2rgb(color));
      else
        return d3.rgb.apply(d3, color);
    });
}

// num divisions slider
function divisions_range_oninput(t) {
  divisions = +t.value;
  divisions_range.textContent = divisions;
  maskcolor_range.max = divisions - 1;
  maskcolor = Math.min(maskcolor, divisions - 2);
  create();
}

// num rings slider
function rings_range_oninput(t) {
  rings = +t.value;
  rings_range.textContent = rings;
  create();
}

// stroke width slider
function strokewidth_range_oninput(t) {
  strokewidth = +t.value;
  strokewidth_range.textContent = strokewidth + 'px';

  svg.selectAll('path')
    .attr('stroke-width', function(d) {
      var d3this = d3.select(this);

      if (d3this.attr('disabled') === '1')
        return 0;

      return strokewidth + 'px';
    })
    .attr('shape-rendering', strokewidth === 0 ? 'crispEdges' : 'auto');
}

// toggle the advanced controls
function toggle_advanced_controls() {
  if (advancedcontrols_div.className)
    advancedcontrols_div.className = '';
  else
    advancedcontrols_div.className = 'hidden';
}

// maskcolor slider
function maskcolor_range_oninput(t) {
  maskcolor = +t.value;
  maskcolor_range_text.innerHTML = maskcolor;

  apply_mask(lastmasktype);
}

// rotation slider
function rotation_range_oninput(t) {
  rotation = +t.value;
  rotation_range.innerHTML = rotation + '&deg;';
  svg.attr('transform', 'translate(' + radius + ',' + radius + ') rotate(' + rotation + ')');
}

// division variance slider
function divisionvariance_range_oninput(t) {
  divisionvariance = +t.value;
  divisionvariance_range.textContent = divisionvariance;

  create();
}

// ring variance slider
function ringvariance_range_oninput(t) {
  ringvariance = +t.value;
  ringvariance_range.textContent = ringvariance;

  create();
}

// toggle ryb rgb button
function toggle_ryb_rgb_button() {
  isryb = !isryb;

  document.title = (isryb ? 'RYB' : 'RGB') + ' Color Picker';
  title.textContent = '- ' + (isryb ? 'ryb' : 'rgb') + ' -';

  // figure out the background color
  svg.selectAll('path')
    .attr('fill', function(d) {
      var d3this = d3.select(this);

      if (d3this.attr('disabled') === '1')
        return;

      var ryb = d.data.neutrals[+d3this.attr('ring')];
      var color = RXB.stepcolor(ryb, brightness / 255, 255);
      if (isryb)
        return d3.rgb.apply(d3, RXB.ryb2rgb(color));
      else
        return d3.rgb.apply(d3, color);
    });
}

// apply a mask
function apply_mask(mask) {
  lastmasktype = mask;

  maskcolor_range.disabled = !mask;

  svg.selectAll('path')
    .attr('fill', function(d, i) {
      var d3this = d3.select(this);

      // figure out the division and ring we are messing with
      var division = +d3this.attr('division');
      var ring = +d3this.attr('ring');

      // figure out what to do
      switch (mask) {
        case 'monochromatic':
          if (division !== maskcolor) {
            d3this.attr('stroke-width', '0');
            d3this.attr('disabled', '1');
            this.style.cursor = 'auto';
            return;
          }
          break;
        case 'analogous':
          if (division !== maskcolor &&
              division !== (maskcolor + 1) % divisions && // one color ahead
              division !== ((((maskcolor - 1) % divisions) + divisions) % divisions)) { // one color behind
            d3this.attr('stroke-width', '0');
            d3this.attr('disabled', '1');
            this.style.cursor = 'auto';
            return;
          }
          break;
        case 'complementary':
          var c = maskcolor % Math.floor(divisions / 2);
          var complement = divisions / 2 + c;
          if (division !== c &&
              division !== Math.ceil(complement) &&
              division !== Math.floor(complement)) {
            d3this.attr('stroke-width', '0');
            d3this.attr('disabled', '1');
            this.style.cursor = 'auto';
            return;
          }
          break;
        case 'triad':
          var q = divisions / 3;
          if (division % q !== maskcolor % (divisions / 3)) {
            d3this.attr('stroke-width', '0');
            d3this.attr('disabled', '1');
            this.style.cursor = 'auto';
            return;
          }
          break;
        default:
          // "None" mask will fall through
          break;
      }

      var ryb = d.data.neutrals[ring];
      var color = RXB.stepcolor(ryb, brightness / 255, 255);

      // apply the normal color
      d3this.attr('stroke-width', strokewidth + 'px');
      d3this.attr('disabled', '0');
      this.style.cursor = 'crosshair';
      if (isryb)
        return d3.rgb.apply(d3, RXB.ryb2rgb(color));
      else
        return d3.rgb.apply(d3, color);
    });
}

window.addEventListener('load', init);
function init() {
  // links should open in new tabs
  d3.selectAll('a').attr('target', 'new');

  // get some html elements
  advancedcontrols_div = document.getElementById('advanced-controls');
  brightness_range = document.getElementById('brightness-range');
  colorpreview_div = document.getElementById('color-preview');
  colorpreviewneutrals_div = document.getElementById('color-preview-neutrals');
  colorpreviewrgb_input = document.getElementById('color-preview-rgb');
  divisions_range = document.getElementById('divisions-range');
  divisionvariance_range = document.getElementById('divisionvariance-range');
  maskcolor_range = document.getElementById('maskcolor-range');
  maskcolor_range_text = document.getElementById('maskcolor-range-text');
  prefix_input = document.getElementById('prefix');
  rings_range = document.getElementById('rings-range');
  ringvariance_range = document.getElementById('ringvariance-range');
  rotation_range = document.getElementById('rotation-range');
  strokecolorpreviews_div = document.getElementById('stroke-color-previews');
  strokewidth_range = document.getElementById('strokewidth-range');
  title_h1 = document.getElementById('stroke-color-previews');

  // strokewidth choices
  strokecolorchoices.forEach(function(hex) {
    var d = document.createElement('div');
    d.style.display = 'table-cell';
    d.style.backgroundColor = hex;
    d.style.cursor = 'crosshair';
    d.title = hex;
    d.onclick = function() {
      strokecolor = hex;
      svg.selectAll('path').attr('stroke', hex);
    };
    d.onmousedown = function() {
      mousedown = true;
    };
    d.onmouseup = function() {
      mousedown = false;
    };
    d.onmouseover = function() {
      if (mousedown)
        d.onclick.call(this);
    };
    strokecolorpreviews_div.appendChild(d);
  });

  // setup advanced controls for auto hide
  document.styleSheets[0].addRule('#advanced-controls', 'max-height: ' + advancedcontrols_div.offsetHeight + 'px;');
  advancedcontrols_div.className = 'hidden';

  // mask color max
  maskcolor_range.max = divisions - 1;

  // make the color wheel
  create();

  // initial color
  var foo = svg.selectAll('path');
  foo.on('click').call(foo[0][0]);

  // optional debug stuff
  if (window.location.hash === '#debug') {
    // show advanced controls
    advancedcontrols_div.className = '';
  }
}

// destroy and recreate the color wheel
function create() {
  try {
    // regenerate the wheel on create
    document.getElementsByTagName('svg')[0].remove();
  } catch(e) {}

  // we generate a rainbow using the divisions set, and map that to a colors
  // ryb representation and its corresponding neutrals
  var data = RXB.rainbow(divisions).map(function(ryb) {
    return {ryb: ryb, neutrals: RXB.neutrals(ryb, 0, rings*2-1)};
  });

  // create the SVG
  svg = d3.select('#content').append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', (-margin) + ' ' + (-margin) + ' ' + (radius*2+margin*2) + ' '  + (radius*2+margin*2))
    .append('g')
    .attr('transform', 'translate(' + radius + ',' + radius + ') rotate(' + rotation + ')');

  // figure out the arc size
  var arcsizes = [0];
  // generate arc sizes in the form of [0, 1, 2, 1, 2, ...]
  for (var i = 0; i < rings; i++)
    arcsizes.push(Math.floor(Math.random() * ringvariance) + 1);

  var arcsizessum = arcsizes.reduce(function(a, b) { return a + b; });
  var ringunitsize = radius / arcsizessum;

  var arcradius = [radius];
  for (var i = 1; i <= rings; i++)
    arcradius[i] = arcradius[i-1] - (arcsizes[i] * ringunitsize);

  // create an arc for each ring
  for (var i = 0; i < rings; i++) {
    var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return Math.floor(Math.random() * divisionvariance + 1); });

    var arc = d3.svg.arc()
      .innerRadius(arcradius[i])
      .outerRadius(arcradius[i+1]);

    svg.selectAll('g')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('stroke', strokecolor)
      .attr('stroke-width', strokewidth + 'px')
      .attr('shape-rendering', strokewidth === 0 ? 'crispEdges' : 'auto')
      .attr('fill', function(d, j) {
        // figure out the background color
        var d3this = d3.select(this);
        d3this.attr('ring', i);
        d3this.attr('division', j);
        var ryb = d.data.neutrals[i];
        var color = RXB.stepcolor(ryb, brightness / 255, 255);
        if (isryb)
          return d3.rgb.apply(d3, RXB.ryb2rgb(color));
        else
          return d3.rgb.apply(d3, color);
      }).on('click', onclick)
      .on('mousedown', function() {
        mousedown = true;
      }).on('mouseup', function() {
        mousedown = false;
      }).on('mouseover', function(d) {
        if (mousedown) {
          // simulate click
          onclick.call(this);
        }
      }).append('svg:title').text(function() {
        // tooltip
        return this.parentNode.getAttribute('fill');
      });

    function onclick() {
      var d3this = d3.select(this);

      if (d3this.attr('disabled') === '1')
        return;

      last_element_clicked = d3this;

      var rgb = this.getAttribute('fill');

      // set the color preview and input field with the RGB value
      colorpreview_div.style.backgroundColor = rgb;
      colorpreview_div.title = rgb;
      colorpreviewrgb_input.value = rgb;

      // figure out the neutrals
      var neutrals = RXB.neutrals(d3this.data()[0].data.neutrals[+d3this.attr('ring')], brightness/255, numneutrals);
      colorpreviewneutrals_div.innerHTML = '';
      for (var i = 0; i < numneutrals; i++) {
        var d = document.createElement('div');
        var colors = neutrals[i];
        if (isryb)
          colors = RXB.ryb2rgb(colors, brightness/255);
        var hex = '#' + RXB.rxb2hex(colors);
        d.style.display = 'table-cell';
        d.style.backgroundColor = hex;
        d.style.border = '1px solid #222';
        d.style.cursor = 'crosshair';
        d.title = hex;
        d.className = 'neutrals';
        d.onclick = function() {
          // set the color preview and input field with the RGB value
          var hex = this.title;
          colorpreview_div.style.backgroundColor = hex;
          colorpreviewrgb_input.value = hex;
        };
        d.onmousedown = function() {
          mousedown = true;
        };
        d.onmouseup = function() {
          mousedown = false;
        };
        d.onmouseover = function() {
          if (mousedown)
            d.onclick.call(this);
        };
        colorpreviewneutrals_div.appendChild(d);
      }
    }
  }
  apply_mask(lastmasktype);
}

function redo_last_click() {
  last_element_clicked.on('click').call(last_element_clicked[0][0]);
}

// download the current svg as a png
function download_png() {
  var html = d3.select('svg')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node().parentNode.innerHTML;

  var canvas = document.createElement('canvas');
  canvas.width = radius * 2 + margin * 2;
  canvas.height = radius * 2 + margin * 2;
  var context = canvas.getContext('2d');

  var image = new Image();
  image.src = 'data:image/svg+xml;base64,' + btoa(html);
  image.onload = function() {
    context.drawImage(image, 0, 0);

    var a = document.createElement('a');
    a.download = get_file_name() + '.png';
    try {
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch(e) {
      var s = 'Error rendering PNG: see the "More Info" link for more information\n\n' + e;
      alert(s);
    }
  };
}

// download the current svg
function download_svg() {
  var html = d3.select('svg')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node().parentNode.innerHTML;

  var a = document.createElement('a');
  a.href = 'data:image/svg+xml;base64,' + btoa(html);
  a.download = get_file_name() + '.svg';
  a.click();
}

// download the neutrals png
function download_neutrals_png() {
  var width = 800;
  var height = 90;
  var margin = 5;

  var size = (width / numneutrals) - margin;

  var neutrals = RXB.neutrals(last_element_clicked.data()[0].data.neutrals[+last_element_clicked.attr('ring')], brightness/255, numneutrals);

  var canvas = document.createElement('canvas');
  canvas.width = width + margin;
  canvas.height = height + (2 * margin);
  var context = canvas.getContext('2d');

  // background
  context.fillStyle = '#111';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // neutrals
  for (var i = 0; i < numneutrals; i++) {
    var colors = neutrals[i];
    if (isryb)
      colors = RXB.ryb2rgb(colors, brightness/255);
    var hex = '#' + RXB.rxb2hex(colors);
    context.fillStyle = hex;
    context.fillRect((size * i) + (margin * (i+1)), margin, size, height);
  }

  var a = document.createElement('a');
  a.download = 'ryb-neutrals.png';
  if (prefix_input.value)
    a.download = prefix_input.value + '-' + a.download;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function random_click() {
  // simulate clicking a random color
  var foo = svg.selectAll('path');
  foo.on('click').call(foo[0][Math.floor(Math.random() * foo[0].length - 1)]);
}

// construct a filename by encoding the current data
function get_file_name() {
  var s = [
    'b' + -brightness,
    'd' + divisions,
    'r' + rings,
    's' + strokewidth,
    'rot' + rotation,
    'dv' + divisionvariance,
    'rv' + ringvariance,
    isryb ? 'ryb' : 'rgb',
  ].join('-');
  if (prefix_input.value)
    s = prefix_input.value + '-' + s;
  return s;
}
