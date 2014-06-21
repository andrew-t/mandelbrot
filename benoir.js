self.addEventListener('message', function(e) {

	var height = e.data.height;
	var width = e.data.width;
	var yi = e.data.yi;
	var xi = e.data.xi;
	var step = e.data.step;
	var maxr = e.data.maxr;
	var maxcol = e.data.maxcol;

	var y = yi, x, zx, zy, newzx, newzy, i, r2 = maxr * maxr, imi = 0, im = [];
	for (var u = 0; u < height; ++u) {
		x = xi;
		for (var v = 0; v < width; ++v) {
			// take a point called z in the complex plane
			zx = x;
			zy = y;
			i = 0;
			do {
				// let z0 be z^2 + z
				newzx = zx * zx - zy * zy + x;
				newzy = 2 * zx * zy + y;
				// and z1 be z0^2 + z
				zx = newzx;
				zy = newzy;
				// and so on
			} while ((++i < maxcol) &&
				(zx * zx + zy * zy < r2))
			if (i >= maxcol) {
				// if the series of zs will always stay
				// close to z, and never trend away
				// that point is in the Mandelbrot set
				im[imi++] = im[imi++] = im[imi++] = 0;
				im[imi++] = 255;
			} else {
				i *= 765 / maxcol;
				im[imi++] = i <   0 ? i > 255 ? 0 : 255 : 255 - i;
				im[imi++] = i < 255 ? i > 510 ? 0 : 255 : 510 - i;
				im[imi++] = i < 510 ? i > 765 ? 0 : 255 : 765 - i;
				im[imi++] = 255;
			}
			x += step;
		}
		y += step;
	}

	self.postMessage(im);

});