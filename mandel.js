var settings = {
	maxcol: 200,
	maxr: 5,
	maxcolmult: 1.5,
	maxmaxcol: 3000,
	zoomfactor: 2,
	zoomdelay: 0.3 //seconds
};

document.addEventListener('DOMContentLoaded', function() {
	var benoir = new Worker('benoir.js'), c, ctx, im, benoirsLastJob, x, y, step;

	// initialisation
	c = document.getElementById('can');
	c.width = c.offsetWidth * (window.devicePixelRatio || 1);
	c.height = c.offsetHeight * (window.devicePixelRatio || 1);
	ctx = c.getContext("2d");
	im = ctx.getImageData(0, 0, c.width, c.height);

	function domandel(e) {
		if (window['Uint8ClampedArray'])
			im.data.set(e.data);
		else for (var i = 0; i < im.data.length; ++i)
			im.data[i] = e.data[i];
		ctx.putImageData(im, 0, 0);
		// safari needs the -webkit- prefix.
		c.style.webkitTransition = 'none';
		c.style.webkitTransform = 'none';
		c.style.transition = 'none';
		c.style.transform = 'none';
		c.style.cursor = 'pointer';
	}

	function zoom(zoomlevel, origin) {
		c.style.webkitTransition = '-webkit-transform ' + settings.zoomdelay + 's ease-in-out';
		c.style.webkitTransform = 'scale(' + zoomlevel + ')';
		c.style.webkitTransformOrigin = origin.x + 'px ' + origin.y + 'px';
		c.style.transition = 'transform ' + settings.zoomdelay + 's ease-in-out';
		c.style.transform = 'scale(' + zoomlevel + ')';
		c.style.transformOrigin = origin.x + 'px ' + origin.y + 'px';
		c.style.cursor = 'default';
		return Q.delay(settings.zoomdelay * 1000);
	}

	function startBenoir(job) {
		var benoirsDeferred = Q.defer(),
			handler = function (result) { 
				benoirsDeferred.resolve(result); 
			};
		benoir.addEventListener('message', handler);
		benoirsDeferred.promise.then(function() {
			benoir.removeEventListener('message', handler);
		});
		benoir.postMessage(job);
		return benoirsDeferred.promise;
	}

	function init() {
		step = 2 / ((c.width > c.height) ? c.height : c.width);
		x = -(c.width * 0.7) * step;
		y = -(c.height / 2) * step;
		startBenoir(benoirsLastJob = {
			height: im.height,
			width: im.width,
			yi: y,
			xi: x,
			step: step,
			maxr: settings.maxr,
			maxcol: settings.maxcol
		}).then(domandel);
	}
	init();

	// click to zoom
	var calculating = false, history = document.getElementById('history');
	document.getElementById('can').addEventListener('click', function(e) {
		if (document.body.classList.contains('menu')) {
			document.body.classList.remove('menu');
			return;
		}

		if (calculating) return;
		calculating = true;

		var li = document.createElement('li'),
			img = document.createElement('img');
		img.src = c.toDataURL();
		li.appendChild(img);
		history.appendChild(li);

		step /= settings.zoomfactor;
		x += e.pageX * step * (settings.zoomfactor - 1);
		y += e.pageY * step * (settings.zoomfactor - 1);

		settings.maxcol *= settings.maxcolmult;
		if (settings.maxcol > settings.maxmaxcol) settings.maxcol = settings.maxmaxcol;
		document.getElementById('maxcol').value = Math.floor(settings.maxcol);

		var started = new Date();
		Q.all([
			startBenoir(benoirsLastJob = {
				height: im.height,
				width: im.width,
				yi: y,
				xi: x,
				step: step,
				maxr: settings.maxr,
				maxcol: settings.maxcol
			}),
			zoom(settings.zoomfactor, {x: e.pageX, y: e.pageY})
		]).then(function(results) {
			domandel(results[0]);
			calculating = false;
			settings.zoomdelay = (new Date() - started) * 0.001;
			console.log('frame took ' + settings.zoomdelay + 'ms');
		});
	});

	document.getElementById('recalculate').addEventListener('click', function() {
		benoirsLastJob.maxcol = settings.maxcol;
		benoirsLastJob.maxr = settings.maxr;
		return startBenoir(benoirsLastJob).then(domandel);
	});

	document.getElementById('restart').addEventListener('click', function() {
		init();
	});
});