function asmodule(stdlib, foreign, heap) {

	var H = new stdlib.Int32Array(heap);
	var width = 0, height = 0, i = 0, cols = 0;

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

	function init(_width, _height, _cols) {
		width = _width;
		height = _height;
		cols = _cols;
	}

	function mandel(xi, yi, step, max, r2) {
		var y = yi, x, v, n;

		i = (cols << 2) - 1;
		y = yi;
		for (var u = 0; (u - height) & -2147483648; ++u) {
			x = xi;
			for (v = 0; (v - width) & -2147483648; ++v) {
				n = iter(x, y, max, r2);
				if ((n|0) >= (max|0)) {
					H[++i] = 0;
					H[++i] = 0;
					H[++i] = 0;
				} else {
					H[++i] = H[n = ((n % cols) << 2)];
					H[++i] = H[++n];
					H[++i] = H[++n];
				}
				H[++i] = 255;
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

var buffer, arr, asm, bSize;
var cols = 512, cols4 = cols * 4;

self.addEventListener('message', function(e) {

	var height = e.data.height;
	var width = e.data.width;
	var yi = e.data.yi;
	var xi = e.data.xi;
	var step = e.data.step;
	var maxr = e.data.maxr;
	var maxcol = e.data.maxcol;

	if (!asm) {
		bSize = (height * width + cols) * 4;
		if (bSize && 0xffff) {
			bSize = (bSize & ~0xffff) + 0x10000;
		}
		buffer = new ArrayBuffer(bSize * 4);
		arr = new Int32Array(buffer);
		for (var i = 0, j = 0, ii; i < cols; ++i) {
			if (i >= 256) {
				ii = (i / 256) - 1;
				arr[j++] = Math.pow(ii, 0.2) * 255;
				arr[j++] = Math.pow(ii, 0.8) * 255;
				arr[j++] = Math.pow(ii, 5.0) * 255;
				arr[j++] = 255;
			} else {
				ii = i / 256;
				arr[j++] = (1 - Math.sqrt(ii)) * 255;
				arr[j++] = (1 - ii) * 255;
				arr[j++] = (1 - ii * ii) * 255;
				arr[j++] = 255;
			}
			if (ii < 0) console.log(i + '!');
			if (ii > 1) console.log(i);
		}
		asm = asmodule({ Math: Math, Int32Array: Int32Array }, {}, buffer);
		asm.init(width, height, cols);
	}

	asm.mandel(xi, yi, step, maxcol, maxr * maxr);

	self.postMessage(arr.subarray(cols4, bSize));

});