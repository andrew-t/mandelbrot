function colour(i, cache) {
	if (i >= 1)
		return [0, 0, 0, 255];
	if (cache[i])
		return cache[i];
	var phase = Math.floor(i * 28) % 2;
	i = i * 28 % 1;
	switch (phase) {
		case 0:
			return cache[i] = [
				Math.pow(i, 0.2) * 255,
				Math.pow(i, 0.8) * 255,
				Math.pow(i, 5) * 255,
				255
			];
		case 1:
			return cache[i] = [
				(1 - Math.sqrt(i)) * 255,
				(1 - i) * 255,
				(1 - i * i) * 255,
				255
			];
	}
}

function asmodule() {
	"use asm";

	function iter(x, y, max, r2) {
		x = +x; y = +y; max = max|0; r2 = +r2;
		// take a point called z in the complex plane
		var zx = 0.0;
		var zy = 0.0;
		var newzx = 0.0;
		var newzy = 0.0;
		var i = 0;
		var zx2 = 0.0;
		var zy2 = 0.0;
		zx = x;
		zy = y;
		zx2 = +(x * x);
		zy2 = +(y * y);
		do {
			// let z0 be z^2 + z
			newzx = +(+(zx2 - zy2) + x);
			newzy = +(+(2.0 * +(zx * zy)) + y);
			// and z1 be z0^2 + z, and so on
			zx = newzx;
			zy = newzy;
			// if the series of zs will always stay
			// close to z, and never trend away
			// that point is in the Mandelbrot set
			if ((max - (i = (i + 1)|0)) & -2147483648)
				return i|0;
			if (+(zx2 = +(zx * zx)) + +(zy2 = +(zy * zy)) > +r2)
				return i|0;
		} while (1);
		return 0;
	}

	return {
		iter: iter
	};
}

var asm = asmodule();

self.addEventListener('message', function(e) {

	var height = e.data.height;
	var width = e.data.width;
	var yi = e.data.yi;
	var xi = e.data.xi;
	var step = e.data.step;
	var maxr = e.data.maxr;
	var maxcol = e.data.maxcol;

	var y = yi, x, zx, zy, newzx, newzy, i, r2 = maxr * maxr, imi = 0, im = [], cols = [], px;
	for (var u = 0; u < height; ++u) {
		x = xi;
		for (var v = 0; v < width; ++v) {asm
			px = colour(asm.iter(x, y, maxcol, r2) / maxcol, cols);
			im.push(px[0]);
			im.push(px[1]);
			im.push(px[2]);
			im.push(px[3]);
			x += step;
		}
		y += step;
	}

	self.postMessage(im);

});