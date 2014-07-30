function colour(i, cache) {
	if (i >= 1)
		return [0, 0, 0, 255];
	if (cache[i])
		return cache[i];
	var phase = Math.floor(i * 28) % 2;
	var i2 = i * 28 % 1;
	switch (phase) {
		case 0:
			return cache[i] = [
				Math.pow(i2, 0.2) * 255,
				Math.pow(i2, 0.8) * 255,
				Math.pow(i2, 5) * 255,
				255
			];
		case 1:
			return cache[i] = [
				(1 - Math.sqrt(i2)) * 255,
				(1 - i2) * 255,
				(1 - i2 * i2) * 255,
				255
			];
	}
}

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
				(zx * zx + zy * zy < r2));
			// if the series of zs will always stay
			// close to z, and never trend away
			// that point is in the Mandelbrot set
			px = colour(i / maxcol, cols);
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