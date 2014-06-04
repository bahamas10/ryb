/* jshint browser: true */
/* globals d3, RXB */
// defaults


var debug = window.location.hash === '#debug';

var borderwidth = 10;
var bordercolor = 0;
var bordercolors = [
  '#777',
  '#444'
];
var brightness = 0;
var divisions = 12;
var divisionvariance = 1;
var isryb = true;
var lastmasktype = '';
var margin = borderwidth + 10;
var maskcolor = '#333';
var maskrotation = 0;
var maskspread = 0;
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
var bordercolor_range;
var borderwidth_range;
var brightness_range;
var colorpreview_div;
var colorpreviewneutrals_div;
var colorpreviewrgb_input;
var divisions_range;
var divisionvariance_range;
var maskspread_range;
var maskspread_range_text;
var maskrotation_range;
var maskrotation_range_text;
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

// RYB magic colors
var RYB_MAGIC_COLORS = JSON.parse(JSON.stringify(RXB.MAGIC_COLORS));

// page loaded
window.addEventListener('load', init);
function init() {
  // links should open in new tabs
  d3.selectAll('a').attr('target', 'new');

  // lifting the mouseup anywhere should affect everything
  document.onmouseup = function() {
    mousedown = false;
  };

  // get some html elements
  bordercolor_range = document.getElementById('bordercolor-range');
  borderwidth_range = document.getElementById('borderwidth-range');
  brightness_range = document.getElementById('brightness-range');
  colorpreview_div = document.getElementById('color-preview');
  colorpreviewneutrals_div = document.getElementById('color-preview-neutrals');
  colorpreviewrgb_input = document.getElementById('color-preview-rgb');
  divisions_range = document.getElementById('divisions-range');
  divisionvariance_range = document.getElementById('divisionvariance-range');
  maskrotation_range = document.getElementById('maskrotation-range');
  maskrotation_range_text = document.getElementById('maskrotation-range-text');
  maskspread_range = document.getElementById('maskspread-range');
  maskspread_range_text = document.getElementById('maskspread-range-text');
  prefix_input = document.getElementById('prefix');
  rings_range = document.getElementById('rings-range');
  ringvariance_range = document.getElementById('ringvariance-range');
  rotation_range = document.getElementById('rotation-range');
  strokecolorpreviews_div = document.getElementById('stroke-color-previews');
  strokewidth_range = document.getElementById('strokewidth-range');
  title_h1 = document.getElementById('title');

  // strokewidth choices
  strokecolorchoices.forEach(function(hex) {
    var d = document.createElement('div');
    d.style.display = 'table-cell';
    d.style.backgroundColor = hex;
    d.style.cursor = 'crosshair';
    d.title = hex;
    d.onclick = function() {
      strokecolor = hex;
      maskcolor = hex;
      svg.selectAll('path.color-wedge').attr('stroke', hex);
      svg.select('g.mask')
        .selectAll('path')
        .attr('fill', maskcolor)
        .attr('stroke', maskcolor);
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

  // Setup pure CSS accordion
  var accordionsections = document.getElementsByClassName('accordion-section');
  Array.prototype.forEach.call(accordionsections, function(section) {
    var button = section.getElementsByTagName('button')[0];
    var content = section.getElementsByClassName('content')[0];
    var maxHeight = content.offsetHeight + 'px';

    var span = document.createElement('span');
    span.style.float = 'left';
    span.style.marginRight = '10px';
    button.appendChild(span);

    button.onclick = function() {
      if (content.classList.contains('hidden')) {
        content.style.maxHeight = maxHeight;
        content.classList.remove('hidden');
        span.innerHTML = '&#9660;';
      } else {
        content.style.maxHeight = 0;
        content.classList.add('hidden');
        span.innerHTML = '&#9658;';
      }
    };

    // hidden by default
    content.classList.add('hidden');
    span.innerHTML = '&#9658;';

    // conditionally show things
    if (section.classList.contains('show') || debug)
      button.onclick.call(button);
  });

  // make the color wheel
  create();

  // initial color
  var foo = svg.selectAll('path.color-wedge');
  foo.on('click').call(foo[0][0]);

  // FUN
  if (window.location.hash === '#???')
    random_magic_colors();
}

// brightness slider
function brightness_range_oninput(t) {
  brightness_range.textContent = t.value;
  brightness = -t.value;

  // figure out the background color
  svg.selectAll('path.color-wedge')
    .attr('fill', function(d) {
      var d3this = d3.select(this);

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
  var val = +t.value;
  switch (val) {
    case 1: divisions = 3; break;
    case 2: divisions = 6; break;
    default: divisions = 12 * (val - 2); break;
  }
  divisions_range.textContent = divisions;

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

  svg.selectAll('path.color-wedge')
    .attr('stroke-width', function(d) {
      return strokewidth + 'px';
    })
    .attr('shape-rendering', strokewidth === 0 ? 'crispEdges' : 'auto');
}

// mask rotation slider
function maskrotation_range_oninput(t) {
  maskrotation = +t.value;
  maskrotation_range_text.innerHTML = maskrotation.toFixed(2) + '&deg;';

  svg.selectAll('g.mask')
    .attr('transform', 'rotate(' + maskrotation + ')');
}

// mask spread slider
function maskspread_range_oninput(t) {
  maskspread = +t.value;
  maskspread_range_text.textContent = maskspread;

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

// border width slider
function borderwidth_range_oninput(t) {
  borderwidth = +t.value;
  borderwidth_range.textContent = borderwidth;
  margin = borderwidth + 10;

  d3.select(svg.node().parentNode)
    .attr('viewBox', (-margin) + ' ' + (-margin) + ' ' + (radius*2+margin*2) + ' '  + (radius*2+margin*2));
  svg.select('circle')
    .attr('r', radius + borderwidth);
  apply_mask(lastmasktype);
}

// border color slider
function bordercolor_range_oninput(t) {
  bordercolor = +t.value;
  bordercolor_range.textContent = bordercolor;

  svg.select('#grad1')
    .selectAll('stop')
    .attr('stop-color', function(d, i) {
      return d3.rgb(bordercolors[i]).darker(bordercolor / 10);
    });
  svg.select('g.mask')
    .selectAll('path')
    .attr('fill', maskcolor)
    .attr('stroke', maskcolor);
}

function disable_ryb_interpolation() {
  var title = 'RGB Color Wheel';
  document.title = title;
  title_h1.textContent = title;

  isryb = false;

  colorize();
}

function enable_ryb_interpolation() {
  var title = 'RYB Color Wheel';
  document.title = title;
  title_h1.textContent = title;

  // revert the magic colors
  revert_magic_colors();

  isryb = true;

  colorize();
}

function enable_custom_interpolation() {
  var title = 'RXB Color Wheel';
  document.title = title;
  title_h1.textContent = title;

  random_magic_colors();

  isryb = true;

  colorize();
}

function colorize() {
  svg.selectAll('path.color-wedge')
    .attr('fill', function(d) {
      var d3this = d3.select(this);

      var ryb = d.data.neutrals[+d3this.attr('ring')];
      var color = RXB.stepcolor(ryb, brightness / 255, 255);
      if (isryb)
        return d3.rgb.apply(d3, RXB.ryb2rgb(color));
      else
        return d3.rgb.apply(d3, color);
    });
}

// destroy and recreate the color wheel
function create() {
  var i;
  try {
    // regenerate the wheel on create
    document.getElementsByTagName('svg')[0].remove();
  } catch(e) {}

  // we generate a rainbow using the divisions set, and map that to a colors
  // ryb representation and its corresponding neutrals
  var data = RXB.rainbow(divisions).map(function(ryb) {
    return {ryb: ryb, neutrals: RXB.neutrals(ryb, 0, rings*2-1)};
  });

  // adjust the mask rotation step
  maskrotation_range.step = 360 / divisions;
  maskrotation = Math.floor(maskrotation / divisions) * maskrotation_range.step;

  // create the SVG
  svg = d3.select('#content').append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', (-margin) + ' ' + (-margin) + ' ' + (radius*2+margin*2) + ' '  + (radius*2+margin*2))
    .append('g')
    .attr('transform', 'translate(' + radius + ',' + radius + ') rotate(' + rotation + ')');

  var defs = svg.append('defs');
  var grad1 = defs.append('radialGradient')
    .attr('id', 'grad1');
  grad1.append('stop')
    .attr('offset', '90%')
    .attr('stop-color', d3.rgb(bordercolors[0]).darker(bordercolor / 10));
  grad1.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', d3.rgb(bordercolors[1]).darker(bordercolor / 10));
    /*
  grad1.append('stop')
    .attr('offset', '96%')
    .attr('stop-color', '#424242');
  grad1.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#8c8c8c');
    */

  // figure out the arc size
  var arcsizes = [0];
  // generate arc sizes in the form of [0, 1, 2, 1, 2, ...]
  for (i = 0; i < rings; i++)
    arcsizes.push(Math.floor(Math.random() * ringvariance) + 1);

  var arcsizessum = arcsizes.reduce(function(a, b) { return a + b; });
  var ringunitsize = radius / arcsizessum;

  var arcradius = [radius];
  for (i = 1; i <= rings; i++)
    arcradius[i] = arcradius[i-1] - (arcsizes[i] * ringunitsize);

  // make the outermost ring first (the outline / border)
  svg.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', radius + borderwidth)
    .attr('fill', 'url(#grad1)');

  // create an arc for each ring
  for (i = 0; i < rings; i++) {
    pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return Math.floor(Math.random() * divisionvariance + 1); });

    arc = d3.svg.arc()
      .innerRadius(arcradius[i])
      .outerRadius(arcradius[i+1]);

    svg.selectAll('g')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('class', 'color-wedge')
      .attr('stroke', strokecolor)
      .attr('stroke-width', strokewidth + 'px')
      .attr('shape-rendering', strokewidth === 0 ? 'crispEdges' : 'auto')
      .attr('fill', function(d, j) {
        // figure out the background color
        this.style.cursor = 'crosshair';
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
          colors = RXB.ryb2rgb(colors);
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
      colors = RXB.ryb2rgb(colors);
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
  var foo = svg.selectAll('path.color-wedge');
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

// create a mask
function apply_mask(mask) {
  lastmasktype = mask;

  svg.selectAll('g.mask').remove();

  var data = [];

  // figure out what to do
  switch (mask) {
    case 'monochromatic':
      data = [1, 0, 0, 0, 0, 0];
      break;
    case 'analogous':
      data = [1, 0, 0];
      break;
    case 'complementary':
      data = [1, 0, 0, 1, 0, 0];
      break;
    case 'double-complementary':
      data = [1, 1, 0, 0, 0, 0];
      break;
    case 'split-complementary':
      data = [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0];
      break;
    case 'tetradic':
      data = [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];
      break;
    case 'square':
      data = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0];
      break;
    case 'diadic':
      data = [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      break;
    case 'triadic':
      data = [1, 0, 1, 0, 1, 0];
      break;
    default:
      // "None" mask will fall through
      break;
  }

  var pie = d3.layout.pie()
    .sort(null)
    .value(function(d, i) {
      return 1 + (d * maskspread / 10);
    });

  var arc = d3.svg.arc()
    .innerRadius(0)
    .outerRadius(radius + 1);

  var g = svg
    .append('g')
    .attr('transform', 'rotate(' + maskrotation + ')')
    .attr('class', 'mask');

  g.selectAll('g')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('class', 'mask')
    .attr('stroke', maskcolor)
    .on('mouseup', function() {
      mousedown = false;
    })
    .attr('fill', function(d, i) {
      this.style.visibility = d.data ? 'hidden' : 'visible';
      this.style.cursor = d.data ? 'crosshair' : 'auto';
      return maskcolor;
    });
}

// meant for fun
function random_magic_colors() {
  for (var i in RXB.MAGIC_COLORS) {
    for (var j = 0; j < 3; j++) {
      RXB.MAGIC_COLORS[i][j] = Math.random();
    }
  }
}

// revert the fun
function revert_magic_colors() {
  for (var i in RXB.MAGIC_COLORS) {
    for (var j = 0; j < 3; j++) {
      RXB.MAGIC_COLORS[i][j] = RYB_MAGIC_COLORS[i][j];
    }
  }
}
