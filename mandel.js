'use strict';

var settings = {
		maxcol: 200,
		maxr: 5,
		maxcolmult: 1.5,
		maxmaxcol: 3000,
		zoomfactor: 2,
		zoomdelay: 0.3 //seconds
	},
	mapDiv,
	benoir = new WorkerManager('benoir.js');
benoir.defaults = settings;
benoir.maxQueueLength = 100;

document.addEventListener('DOMContentLoaded', function() {
	//var benoir = new Worker('benoir.js'), c, ctx, im, benoirsLastJob, x, y, step;

	mapDiv = document.getElementById('complex-plane');

	var layer = L.tileLayer.canvas({ async: true });
	layer.drawTile = function(canvas, tilePoint, zoom) {
	    benoir.do({
	    	xi: 0,
	    	yi: 0,
	    	step: 0.01,
	    	width: canvas.width,
	    	height: canvas.height
	    }).then(function(arr) {
	    	console.log('getting context');
	    	var ctx = canvas.getContext('2d'),
	    		im = ctx.getImageData(0, 0, canvas.width, canvas.height);
	    	console.log('pasting data');
			if (window['Uint8ClampedArray'])
				im.data.set(arr);
			else for (var i = 0; i < im.data.length; ++i)
				im.data[i] = arr[i];
	    	console.log('putting image');
	    	ctx.putImageData(im, 0, 0);
	    	console.log('calling drawn...');
	    	layer.tileDrawn(canvas);
	    	console.log('drawn');
	    });
	}

	var complexPlane = L.map(mapDiv, {
	    center: [0, 0],
	    zoom: 1,
	    //crs: L.CRS.Simple
	});

	complexPlane.addLayer(layer);
	return;

	// initialisation
	c = document.getElementById('can');
	c.width = c.offsetWidth * (window.devicePixelRatio || 1);
	c.height = c.offsetHeight * (window.devicePixelRatio || 1);
	ctx = c.getContext("2d");
	im = ctx.getImageData(0, 0, c.width, c.height);

	function domandel(e, noPush) {
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
		calculating = false;
		if (window.history && !noPush)
			window.history.pushState({
				x: x,
				y: y,
				step: step,
				height: 300,
				width: 300
			}, document.title, '#' + x + ',' + y + ',' + (step * (window.devicePixelRatio || 1)));
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

	function go() {
		return startBenoir(benoirsLastJob = {
			height: im.height,
			width: im.width,
			yi: y,
			xi: x,
			step: step,
			maxr: settings.maxr,
			maxcol: settings.maxcol
		}).then(domandel);
	}

	function init() {
		try {
			var bits = window.location.hash.substr(1).split(',');
			x = parseFloat(bits[0]);
			y = parseFloat(bits[1]);
			step = parseFloat(bits[2]) / (window.devicePixelRatio || 1);
			if (isNaN(x) || isNaN(y) || isNaN(step))
				throw 'This is bad practice but fine for this.';
		} catch(e) {
			step = 2 / ((c.width > c.height) ? c.height : c.width);
			x = -(c.width * 0.7) * step;
			y = -(c.height / 2) * step;
		}
		return go();
	}
	init();

	function pushHistory() {
		var li = document.createElement('li'),
			img = document.createElement('img');
		img.src = c.toDataURL();
		li.appendChild(img);
		history.appendChild(li);
	}

	// click to zoom
	var calculating = true, history = document.getElementById('history');
	document.getElementById('can').addEventListener('click', zoomIn);
	document.getElementById('can').addEventListener('contextmenu', zoomOut);

	function zoomIn(e) {
		if (e.which == 2)
			return zoomOut(e);

		if (calculating ||
			e.which != 1 ||
			document.body.classList.contains('menu'))
			return;
		calculating = true;

		pushHistory();

		step /= settings.zoomfactor;
		x += e.pageX * step * (settings.zoomfactor - 1) * c.width / c.offsetWidth;
		y += e.pageY * step * (settings.zoomfactor - 1) * c.height / c.offsetHeight;

		settings.maxcol *= settings.maxcolmult;
		if (settings.maxcol > settings.maxmaxcol) settings.maxcol = settings.maxmaxcol;
		document.getElementById('maxcol').value = Math.floor(settings.maxcol);

		triggerBenoir(e, false);
	}

	function zoomOut(e) {
		if (calculating ||
			document.body.classList.contains('menu'))
			return;
		calculating = true;
		e.preventDefault();

		pushHistory();

		step *= settings.zoomfactor;
		x += e.pageX * step * (1 / settings.zoomfactor - 1) * c.width / c.offsetWidth;
		y += e.pageY * step * (1 / settings.zoomfactor - 1) * c.height / c.offsetHeight;

		// TODO - fix up this maxcol business.
		settings.maxcol /= settings.maxcolmult;
		document.getElementById('maxcol').value = Math.floor(settings.maxcol);

		triggerBenoir(e, true);
	}

	function triggerBenoir(e, out) {
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
			zoom(out ? 1 / settings.zoomfactor : settings.zoomfactor,
				{x: e.pageX, y: e.pageY})
		]).then(function(results) {
			domandel(results[0]);
			settings.zoomdelay = (new Date() - started) * 0.001;
			console.log('frame took ' + settings.zoomdelay + 'ms');
		});
	}

	document.getElementById('recalculate').addEventListener('click', function() {
		benoirsLastJob.maxcol = settings.maxcol;
		benoirsLastJob.maxr = settings.maxr;
		return startBenoir(benoirsLastJob).then(domandel);
	});

	document.getElementById('restart').addEventListener('click', function() {
		init();
	});

	window.addEventListener('popstate', function(event) {
		benoirsLastJob.xi = x = event.state.x;
		benoirsLastJob.yi = y = event.state.y;
		benoirsLastJob.step = step = event.state.step;
		benoirsLastJob.maxcol = settings.maxcol;
		benoirsLastJob.maxr = settings.maxr;
		return startBenoir(benoirsLastJob).then(function(e) {
			domandel(e, true);
		});
		go();
	});
});
