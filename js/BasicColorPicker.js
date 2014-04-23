/**
 * Create an RYB color picker
 * MIT License
 */

;(function(global) {
  global.BasicColorPicker = BasicColorPicker;
  BasicColorPicker.colorpicker = colorpicker;

  /**
   * Load an element with divs creating an RYB rainbow
   *
   * @param element {DOMElement}  this element will be loaded with divs creating a rainbow
   * @param opts    {object}      an optional object defining options
   *
   * @options {
   *   step: {int}, the number of colors to step for each iteration of rainbow generation
   *   onclick: {function}, an optional function to set as the onclick handler of each colored div created
   *   style: {object}, an elements defined here will be copied to the colored div's style attribute
   * }
   *
   * returns the children of the element
   */
  function colorpicker(element, opts) {
    opts = opts || {};
    opts.onclick = opts.onclick || function() {};
    opts.style = opts.style || {};

    element.onselectstart = function() { return false; };

    var mousedown = false;
    var r = RXB.rainbow((256+256+256*2) / 3);

    for (var i = 0; i < r.length; i++) {
      var color = r[i];
      var rgb = opts.rgb ? color : RXB.ryb2rgb(color);
      var hex = RXB.d2h(rgb[0]) + RXB.d2h(rgb[1]) + RXB.d2h(rgb[2]);

      // Create and append the new element
      var div = document.createElement('div');
      for (var j in opts.style) {
        if (!opts.style.hasOwnProperty(j))
          continue;
        div.style[j] = opts.style[j];
      }
      div.style.width = div.style.width || '1px';
      div.style.backgroundColor = '#' + hex;
      div.style.float = 'left';
      div.onselectstart = function() { return false; };
      div.className = 'rxb-picker-color';

      div.setAttribute('data-ryb-r', color[0]);
      div.setAttribute('data-ryb-y', color[1]);
      div.setAttribute('data-ryb-b', color[2]);

      div.onclick = opts.onclick;
      div.onmousedown = onmousedown;
      div.onmouseup = onmouseup;
      div.onmouseover = onmouseover;

      element.appendChild(div);
    }

    function onmousedown() {
      mousedown = true;
    }
    function onmouseup() {
      mousedown = false;
    }
    function onmouseover() {
      if (mousedown)
        this.click();
    }

    return element.children;
  }

  /**
   * Create a standalone RYB color picker in any div
   *
   * @param element {DOMElement} the dom element to be used as the color picker
   */
  function BasicColorPicker(element, opts) {
    var val = 0;

    var pixels;
    var activeelem;
    var activeswatch;
    var activecolor;
    var neutralswatch;

    var height = '20px';
    var neutralspacing = 3;

    var input_rgb;
    var input_rawryb;
    var input_rybstepped;
    var label_value;

    // given an HTML element, extract the RYB values
    function getryb(elem) {
      var r = +elem.getAttribute('data-ryb-r');
      var y = +elem.getAttribute('data-ryb-y');
      var b = +elem.getAttribute('data-ryb-b');
      return [r, y, b];
    }

    // the range has changed
    function range_oninput() {
      val = -this.value;
      // loop all `rxb-picker-colors` and step the colors by the new value
      for (var i = 0; i < pixels.length; i++) {
        var pixel = pixels[i];
        var ryb = getryb(pixel);
        var rybstepped = RXB.stepcolor(ryb, val / 255, 255);
        var rgb = RXB.ryb2rgb(rybstepped);
        var hex = RXB.rxb2hex(rgb);
        pixel.style.backgroundColor = '#' + hex;
      }
      activeelem.click();
      activeswatch.click();
    }

    // pixel onclick
    function pixel_onclick() {
      activeelem = this;
      var ryb = getryb(activeelem);
      drawneutral(ryb, 9);
      setactivecolor(ryb);
    }

    // neutral click event
    function neutralswatch_onclick() {
      //activeelem = this;
      activeswatch = this;
      var ryb = getryb(activeswatch);
      setactivecolor(ryb);
    }

    // set the active color
    function setactivecolor(ryb) {
      var rybhex = RXB.rxb2hex(ryb);
      var rybstepped = RXB.stepcolor(ryb, val / 255, 255);
      var rybsteppedhex = RXB.rxb2hex(rybstepped);
      var rgb = RXB.ryb2rgb(rybstepped);
      var rgbhex = RXB.rxb2hex(rgb);
      activecolor.style.backgroundColor = '#' + rgbhex;

      input_rgb.value = '#' + rgbhex;
      input_rawryb.value = '#' + rybhex;
      label_value.innerText = val;
      input_steppedryb.value = '#' + rybsteppedhex;
    }

    /**
     * Draw neutral spectrum given an HTML element and
     * an RYB hex string or array of count times
     */
    function drawneutral(color, count) {
      // Calculate neutrals
      var neuts = RXB.neutrals(color, val / 255, count);

      // clear the div
      while (neutralswatch.firstChild)
        neutralswatch.removeChild(neutralswatch.firstChild);

      for (var i = 0; i < neuts.length; i++) {
        // Create and append the new element
        var div = document.createElement('div');
        var ryb = neuts[i];
        var rgb = RXB.ryb2rgb(ryb);
        div.style.display = 'table-cell';
        div.style.backgroundColor = '#' + RXB.rxb2hex(rgb);
        div.style.border = '1px solid #ddd';

        div.setAttribute('data-index', i);
        div.setAttribute('data-ryb-r', ryb[0]);
        div.setAttribute('data-ryb-y', ryb[1]);
        div.setAttribute('data-ryb-b', ryb[2]);
        div.setAttribute('data-rgb-r', rgb[0]);
        div.setAttribute('data-rgb-g', rgb[1]);
        div.setAttribute('data-rgb-b', rgb[2]);
        div.onclick = neutralswatch_onclick;
        neutralswatch.appendChild(div);
      }

      return neutralswatch.childen;
    }

    // the exported function calls this
    function _BasicColorPicker(element, opts) {
      // options
      opts = opts || {};
      opts.step = opts.step || 5;
      opts.style = opts.style || {};
      opts.style.cursor = opts.style.cursor || 'crosshair';
      opts.onclick = pixel_onclick;
      height = opts.style.height || height;
      opts.style.height = height;

      element.style.clear = 'both';

      // create the rainbow div
      var rainbowdiv = document.createElement('div');
      rainbowdiv.style.height = height;
      rainbowdiv.style.clear = 'both';
      rainbowdiv.style.border = '1px solid #ddd';
      pixels = colorpicker(rainbowdiv, opts);
      element.appendChild(rainbowdiv);
      // the calculated width of the rainbow table
      var width = +(opts.style.width || '1px').replace(/[^0-9]/g, '') * pixels.length + 2;

      // create the neutral swatch
      neutralswatch = document.createElement('div');
      neutralswatch.style.display = 'table';
      neutralswatch.style.tableLayout = 'fixed';
      neutralswatch.style.height = height;
      neutralswatch.style.width = (width + neutralspacing * 2) + 'px';
      neutralswatch.style.marginTop = '2px';
      neutralswatch.style.marginLeft = -neutralspacing + 'px';
      neutralswatch.style.clear = 'both';
      neutralswatch.style.borderCollapse = 'separate';
      neutralswatch.style.borderSpacing = neutralspacing + 'px 0px';

      element.appendChild(neutralswatch);

      // create the selected color
      activecolor = document.createElement('div');
      activecolor.style.width = (width / 3) + 'px';
      activecolor.style.height = (width / 3) + 'px';
      activecolor.style.float = 'right';
      activecolor.style.marginTop = '5px';
      activecolor.style.border = '2px solid #ddd';
      element.appendChild(activecolor);

      // create the range slider
      var range = document.createElement('input');
      range.type = 'range';
      range.max = '255';
      range.min = '-255';
      range.style.width = (width / 2) + 'px';
      range.oninput = range_oninput;
      element.appendChild(range);

      label_value = document.createElement('label');
      label_value.innerText = '0';
      label_value.style.fontSize = '10pt';
      element.appendChild(label_value);

      var label;

      label = document.createElement('label');
      label.innerHTML = '<br>rgb: ';
      element.appendChild(label);
      input_rgb = document.createElement('input');
      input_rgb.style.width = '65px';
      input_rgb.onclick = function() {
        this.setSelectionRange(0, this.value.length);
      };
      element.appendChild(input_rgb);

      label = document.createElement('label');
      label.innerHTML = '<br><br><small>raw ryb: </small>';
      element.appendChild(label);
      input_rawryb = document.createElement('input');
      input_rawryb.style.width = '65px';
      input_rawryb.onclick = function() {
        this.setSelectionRange(0, this.value.length);
      };
      element.appendChild(input_rawryb);

      label = document.createElement('label');
      label.innerHTML = '<br><small>computed ryb: </small>';
      element.appendChild(label);
      input_steppedryb = document.createElement('input');
      input_steppedryb.style.width = '65px';
      input_steppedryb.onclick = function() {
        this.setSelectionRange(0, this.value.length);
      };
      element.appendChild(input_steppedryb);

      // pull the div down
      var br = document.createElement('br');
      br.style.clear = 'both';
      element.appendChild(br);

      element.style.width = width + 'px';
      element.style.overflow = 'auto';

      activeelem = pixels[0];
      activeelem.click();
      activeswatch = neutralswatch.firstChild;
      activeswatch.click();
    }

    return _BasicColorPicker(element, opts);
  }
})(typeof window === 'undefined' ? exports : window);
