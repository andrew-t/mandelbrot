importScripts('colourloop/colourloop.js');

		self.postMessage({ debug: true, message: 'worker init' });
function calculatrix(foreign, imdata, colours) {

	var width, height, i, cols = (colours.length >> 2);

	function iter(x, y, max, r2) {
		var zx = x, zy = y, newzx;
		var i = 0;
		var zx2 = x * x, zy2 = y * y;
		while (true) {
			newzx = zx2 - zy2 + x;
			zy = 2 * zx * zy + y;
			zx = newzx;
			if ((max - ++i) & -2147483648)
				return i;
			if ((zx2 = zx * zx) + (zy2 = zy * zy) > r2)
				return i;
		}
	}

	function init(_width, _height) {
		width = _width;
		height = _height;
	}

	function mandel(xi, yi, step, max, r2) {
		var y = yi, x, v, n;

		for (var xxx = 0; xxx < arguments.length; ++xxx)
		self.postMessage({ debug: true,
		 message: 'worker arg ' + xxx + '=' + arguments[xxx] });


		i = -1;
		y = yi;
		for (var u = 0; (u - height) & -2147483648; ++u) {
			x = xi;
			for (v = 0; (v - width) & -2147483648; ++v) {
				n = iter(x, y, max, r2);
				if (n >= max) {
					imdata[++i] = 0;
					imdata[++i] = 0;
					imdata[++i] = 0;
				} else {
					imdata[++i] = colours[n = ((n % cols) << 2)];
					imdata[++i] = colours[++n];
					imdata[++i] = colours[++n];
				}
				imdata[++i] = 255;
				x += step;
			}
			y += step;
		}
	}

	return {
		init: init,
		mandel: mandel
	};
}

var arr, asm, bSize;
var cols = 512;

self.addEventListener('message', function(e) {
		self.postMessage({ debug: true, message: 'worker start' });

	var height = e.data.height;
	var width = e.data.width;
	var yi = e.data.yi;
	var xi = e.data.xi;
	var step = e.data.step;
	var maxr = e.data.maxr;
	var maxcol = e.data.maxcol;

	if (!asm) {
		bSize = (height * width) * 4;
		// hack for IE:
		arr = this['Uint8ClampedArray'] ? new Uint8ClampedArray(bSize) : new Int16Array(bSize);

		var colours = [];
		(new colourLoop.moviePosterLoop(1, .5, 0, -.1)).toArray(cols).forEach(function(c) {
			c.asArray().forEach(function(d) {
				colours.push(d);
			});
		});
		asm = calculatrix(
			{},
			arr,
			colours);
		asm.init(width, height);
	}
try {
	asm.mandel(xi, yi, step, maxcol, maxr * maxr);
		self.postMessage({ debug: true, message: 'worker return' });
	self.postMessage(arr);
} catch (e) {

		self.postMessage({ debug: true, message: 'worker error' + e.toString() });
}

});