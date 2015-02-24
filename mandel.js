'use strict';

var settings = {
		maxr: 5,
		maxcol: 200,
		maxcolmult: 2,
		maxmaxcol: 3000,
		tileSide: 0.4,
		tileSize: 256
	},
	benoir = new WorkerManager('benoir.js', { stack: true });
benoir.defaults = settings;

document.addEventListener('DOMContentLoaded', function() {
	var mapDiv = document.getElementById('complex-plane'),
		layer = L.tileLayer.canvas({
			async: true,
			continuousWorld: true,
			detectRetina: true,
			attribution: '<a href="http://www.andrewt.net">andrewt.net</a>'
		});

	benoir.maxQueueLength = 2 * mapDiv.offsetWidth * mapDiv.offsetHeight / (settings.tileSize * settings.tileSize);

	layer.drawTile = function(canvas, tilePoint, zoom) {
		zoom = complexPlane.getZoom();
		var side = settings.tileSide / Math.pow(2, zoom),
			maxcol = settings.maxcol * Math.pow(settings.maxcolmult, zoom);
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
	}

	var complexPlane = L.map(mapDiv, {
	    center: [0, 0],
	    zoom: 0,
	    worldCopyJump: false
	});

	complexPlane.addLayer(layer);
});
