/**
 * Multiple Library files for color manipulation in JavaScript
 *
 * Library for decimal to hex conversion
 * Easily convert hex strings to RGB arrays, etc.
 * adapted from http://javascript.about.com/library/blh2d.htm
 *
 * Library to calculate neutrals colors
 * Author: Dave Eddy <dave@daveeddy.com>
 *
 * Original Work for bicubic interpolation (ryb2rgb)
 * http://threekings.tk/mirror/ryb_TR.pdf
 * Implemented in JS by Dave Eddy <dave@daveeddy.com>
 *
 * Meta-Package by: Dave Eddy <dave@daveeddy.com>
 * MIT License
 */

;(function(global) {
  global.RXB = {};

  /**
   * Clamp a number between a given low and high number
   *
   * @param x    {int} the number to clamp
   * @param low  {int} (default 0) minimum number
   * @param high {int} (default 255) maximum number
   *
   * returns the clamped number
   *
   * ex:
   * clamp(5, 0, 10) => 5
   * clamp(5, 7, 10) => 7
   * clamp(5, 0, 2) => 2
   */
  function clamp(x, low, high) {
    low = low || 0;
    high = high || 255;
    return Math.max(low, Math.min(high, x));
  }


  /**
   * Convert a decimal to a 2 digit hex string
   *
   * @param d  {int} a decimal number
   *
   * returns a digit hex string
   *
   * ex: 9 => '09', 13 => '0d'
   */
  function d2h(d) {
    var hex = Math.round(d).toString(16);
    while (hex.length < 2)
      hex = '0' + hex;
    return hex;
  }

  /**
   * Convert a hex string to decimal
   *
   * @param h  {string} a hex string
   *
   * returns a digit in base 10
   *
   * ex: '0d' => 13, '09' => 9
   */
  function h2d(h) {
    return parseInt(h, 16);
  }

  /**
   * Convert an RGB or RYB array to a hex string
   *
   * @param rxb2hex  {array}  an array like [0, 255, 0]
   *
   * returns a hex string of length 6
   *
   * ex: [0, 255, 0] => '00ff00'
   */
  function rxb2hex(rxb) {
    return d2h(rxb[0]) + d2h(rxb[1]) + d2h(rxb[2]);
  }

  /**
   * Convert a RYB or RGB hex string to an array
   *
   * @param hex2rxb  {string} a string like '0000ff'
   *
   * returns an array of length 3
   *
   * ex: '0000ff' => [0, 0, 255]
   */
  function hex2rxb(hex) {
    if (hex.charAt(0) === '#')
      hex = hex.substr(1);
    var r = hex.substr(0,2);
    var g = hex.substr(2,2);
    var b = hex.substr(4,2);
    return [ h2d(r), h2d(g), h2d(b) ];
  }

  /**
   * Given an RXB array and value, calculate
   * the actual values by darkening or lightening the color
   *
   * @param hex    {array} an array or hex string of an RYB value
   * @param value  {float} a number -1>=value<=1 representing the value to step the color
   * @param limit  {int}   the upper limit of the color range, defaults to 255
   */
  function stepcolor(hex, value, limit) {
    limit = limit || 255;
    var rxb = typeof hex === 'string' ? hex2rxb(hex) : hex;

    var r = rxb[0];
    var x = rxb[1];
    var b = rxb[2];

    var stepR, stepX, stepB;
    if (value > 0) {
      stepR = (limit - r) / limit;
      stepX = (limit - x) / limit;
      stepB = (limit - b) / limit;
    } else {
      stepR = r / limit;
      stepX = x / limit;
      stepB = b / limit;
    }

    r += stepR * value * limit;
    x += stepX * value * limit;
    b += stepB * value * limit;

    return [clamp(r), clamp(x), clamp(b)];
  }

  /**
   * Return the complementary color values for a given RYB color.
   *
   * @param color   {array}  An RYB array
   * @param color   {int}    value, a number between -1 and 1
   * @param count   {limit}  (optional) upper limit, defaults to 255
   *
   * returns a complementary array
   */
  function complementary(color, value, limit) {
    limit = limit || 255;
    var colorstepped = stepcolor(color, value, limit);
    var r = colorstepped[0];
    var y = colorstepped[1];
    var b = colorstepped[2];

    var ncolor = [limit - r, limit - y, limit - b];
    var ncolorstepped = stepcolor(ncolor, value, limit);
    var nr = ncolorstepped[0];
    var ny = ncolorstepped[1];
    var nb = ncolorstepped[2];

    return [nr, ny, nb];
  }

  /**
   * Calculate Neutrals
   *
   * Given a hex RYB string or array, and its value, return an array
   * with `count` number of neutral colors between the color
   * and its complement.
   *
   * @param colors  {string}  An RYB hex string or array
   * @param value   {int}     A number between -1 and 1 defining the value
   * @param count   {int}     Number of neutrals to sample from the color to its complement (default 8)
   *
   * Ex: var neutrals = neutrals('ff00ff', 0, 4);
   */
  function neutrals(hex, value, count) {
    // Set defaults
    count = count || 8;

    var ryb = hex;
    if (typeof hex === 'string')
      ryb = hex2rxb(hex);

    var complement = complementary(ryb, value);
    ryb = stepcolor(ryb, value);
    var d = {
      r: (complement[0] - ryb[0]) / (count - 1),
      y: (complement[1] - ryb[1]) / (count - 1),
      b: (complement[2] - ryb[2]) / (count - 1)
    };

    var n = [];
    for (var i = 0; i < count; i++) {
      // Save it
      n.push(ryb.slice(0));

      // Now move the color
      ryb[0] += d.r;
      ryb[1] += d.y;
      ryb[2] += d.b;
    }

    return n;
  }

  /**
   * Generate an array that represents a rainbow of colors
   * in either RYB or RGB
   *
   * @param step {int} (optional) number of colors to step, defaults to 1 (normal iteration)
   *
   * returns an array of arrays like [[255,0,0],[255,0,1],[255,0,2],...]
   * with every possible color.
   */
  function rainbow(size) {
    var i;
    var numcolors = 3; // 3 possible colors: r, x, b
    var colors = [
      255, // r
      0,   // x
      0    // b
    ];

    // generate a rainbow for all colors
    var addingcolor = true; // adding or subtracting color
    var r = [];
    for (var color = 0; color < numcolors * 2; color++) {
      // color will loop twice, so grab the lower digit
      var thecolor = (color + 2) % numcolors;

      // loop the possible values
      for (i = 0; i < 256; i++) {
        // set the color to i if adding, and 255 -i if subtracting
        colors[thecolor] = addingcolor ? i : 255 - i;

        // push a copy of the array
        r.push(colors.slice(0));
      }

      // flip the bit
      addingcolor = !addingcolor;
    }

    // only push what the user wanted, this si kinda gross
    var ret = [];
    var step = r.length / (size || r.length);
    for (i = 0; Math.ceil(i) < r.length; i += step) {
      ret.push((r[Math.round(i)] || r[Math.floor(i)]).slice(0));
    }
    return ret;
  }

  /**
   * ryb2rgb, the motherload, convert a RYB array to RGB
   *
   * @param ryb   {array} RYB values in the form of [0, 255, 0]
   * @param limit {int}   [optional] max value of the color, defaults to 255
   * @param magic {array} An array of magic colors to use in the color space interpolation
   *
   * returns an array of the RGB values
   */
  var MAGIC_COLORS = [
    [1,     1,     1],
    [1,     1,     0],
    [1,     0,     0],
    [1,     0.5,   0],
    [0.163, 0.373, 0.6],
    [0.0,   0.66,  0.2],
    [0.5,   0.0,   0.5],
    [0.2,   0.094, 0.0]
  ];
  var ryb2rgb = (function() {
    // see http://threekings.tk/mirror/ryb_TR.pdf
    function cubicInt(t, A, B){
      var weight = t * t * (3 - 2 * t);
      return A + weight * (B - A);
    }

    function getR(iR, iY, iB, magic) {
      magic = magic || MAGIC_COLORS;
      // red
      var x0 = cubicInt(iB, magic[0][0], magic[4][0]);
      var x1 = cubicInt(iB, magic[1][0], magic[5][0]);
      var x2 = cubicInt(iB, magic[2][0], magic[6][0]);
      var x3 = cubicInt(iB, magic[3][0], magic[7][0]);
      var y0 = cubicInt(iY, x0, x1);
      var y1 = cubicInt(iY, x2, x3);
      return cubicInt(iR, y0, y1);
    }

    function getG(iR, iY, iB, magic) {
      magic = magic || MAGIC_COLORS;
      // green
      var x0 = cubicInt(iB, magic[0][1], magic[4][1]);
      var x1 = cubicInt(iB, magic[1][1], magic[5][1]);
      var x2 = cubicInt(iB, magic[2][1], magic[6][1]);
      var x3 = cubicInt(iB, magic[3][1], magic[7][1]);
      var y0 = cubicInt(iY, x0, x1);
      var y1 = cubicInt(iY, x2, x3);
      return cubicInt(iR, y0, y1);
    }

    function getB(iR, iY, iB, magic) {
      magic = magic || MAGIC_COLORS;
      // blue
      var x0 = cubicInt(iB, magic[0][2], magic[4][2]);
      var x1 = cubicInt(iB, magic[1][2], magic[5][2]);
      var x2 = cubicInt(iB, magic[2][2], magic[6][2]);
      var x3 = cubicInt(iB, magic[3][2], magic[7][2]);
      var y0 = cubicInt(iY, x0, x1);
      var y1 = cubicInt(iY, x2, x3);
      return cubicInt(iR, y0, y1);
    }

    function ryb2rgb(color, limit, magic) {
      limit = limit || 255;
      magic = magic || MAGIC_COLORS;
      var R = color[0] / limit;
      var Y = color[1] / limit;
      var B = color[2] / limit;
      var R1 = getR(R, Y, B, magic);
      var G1 = getG(R, Y, B, magic);
      var B1 = getB(R, Y, B, magic);
      return [
        Math.ceil(R1 * limit),
        Math.ceil(G1 * limit),
        Math.ceil(B1 * limit)
      ];
    }
    return ryb2rgb;
  })();

  global.RXB.clamp = clamp;
  global.RXB.d2h = d2h;
  global.RXB.h2d = h2d;
  global.RXB.rxb2hex = rxb2hex;
  global.RXB.hex2rxb = hex2rxb;
  global.RXB.stepcolor = stepcolor;
  global.RXB.complementary = complementary;
  global.RXB.neutrals = neutrals;
  global.RXB.rainbow = rainbow;
  global.RXB.MAGIC_COLORS = MAGIC_COLORS;
  global.RXB.ryb2rgb = ryb2rgb;

})(typeof window === 'undefined' ? exports : window);
