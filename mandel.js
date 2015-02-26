'use strict';

var settings = {
		maxr: 5,
		maxcol: 200,
		maxcolmult: 2,
		maxmaxcol: 3000,
		tileSide: 5,
		tileSize: 256
	},
	benoir = new WorkerManager('benoir.js', { stack: true });
benoir.defaults = settings;

document.addEventListener('DOMContentLoaded', function() {
	var mapDiv = document.getElementById('complex-plane'),
		layer = L.tileLayer.canvas({
			async: true,
			continuousWorld: true,
			attribution: '<a href="http://www.andrewt.net">andrewt.net</a>',
			maxZoom: 42,
			maxNativeZoom: 40,
		    bounds: L.latLngBounds(L.latLng(-Infinity, -1e30), L.latLng(Infinity, 1e30))
		});

	// Allow up to N entire scenes to render sequentially.
	benoir.maxQueueLength = 5 * mapDiv.offsetWidth * mapDiv.offsetHeight / (settings.tileSize * settings.tileSize);

	layer.drawTile = function(canvas, tilePoint, zoom) {
		// Not sure why zoom wasn't being passed in...
		zoom = complexPlane.getZoom();
		var side = settings.tileSide / Math.pow(2, zoom),
			maxcol = settings.maxcol * Math.pow(settings.maxcolmult, zoom);
    	if (window.devicePixelRatio != undefined) {
	    	canvas.width = canvas.height = settings.tileSize * window.devicePixelRatio;
	    	canvas.style.width = canvas.style.height = settings.tileSize + 'px';
	    }
	    benoir.do({
	    	xi: tilePoint.x * side,
	    	yi: tilePoint.y * side,
	    	step: side / canvas.width,
	    	width: canvas.width,
	    	height: canvas.height,
	    	maxcol: (maxcol > settings.maxmaxcol) ? settings.maxmaxcol : maxcol
	    }).then(function(arr) {
	    	var ctx = canvas.getContext('2d'),
	    		im = ctx.getImageData(0, 0, canvas.width, canvas.height);
			if (window['Uint8ClampedArray'])
				im.data.set(arr);
			else for (var i = 0; i < im.data.length; ++i)
				im.data[i] = arr[i];
	    	ctx.putImageData(im, 0, 0);
	    	layer.tileDrawn(canvas);
	    });
	};

	// Figure out the initial state from the URL and some defaults:
	var center = [0, -0.5],
		r = 2;
	if (location.hash)
		location.hash.split('#').forEach(function(bit) {
			var split = bit.indexOf('=');
			if (~split) {
				var value = bit.substr(split + 1);
				switch (bit.substr(0, split)) {
					case 'x': center[1] = value; break;
					case 'y': center[0] = value; break;
					case 'r': r = value; break;
				}
			}
		});

	var screenR = mapDiv.offsetWidth > mapDiv.offsetHeight
			? mapDiv.offsetWidth
			: mapDiv.offsetHeight,
		zoom = Math.floor(Math.log2((settings.tileSide / r) / (settings.tileSize / screenR))),
		pxRatio = settings.tileSize / settings.tileSide,
		complexPlane = L.map(mapDiv, {
		    center: center.map(function (x) { return x * pxRatio }),
		    zoom: zoom,
		    worldCopyJump: false,
		    crs: simple()
		});
	complexPlane.addLayer(layer);

	complexPlane.on('move', function(e) {
		var center = complexPlane.getCenter(),
			zoom = (1 << complexPlane.getZoom());
		document.getElementById('permalink').href =
			'#x=' + (center.lng / pxRatio) + 
			'#y=' + (center.lat / pxRatio) + 
			'#r=' + (settings.tileSide * screenR /
				(settings.tileSize * zoom));
	});
});
