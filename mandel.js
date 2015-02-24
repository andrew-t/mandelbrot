'use strict';

var settings = {
		maxr: 5,
		maxcol: 3000,
		zoomfactor: 2,
		tileSide: 0.4
	},
	benoir = new WorkerManager('benoir.js');
benoir.defaults = settings;
benoir.maxQueueLength = 100;

document.addEventListener('DOMContentLoaded', function() {
	var mapDiv = document.getElementById('complex-plane'),
		layer = L.tileLayer.canvas({
			async: true,
			continuousWorld: true,
			detectRetina: true,
			attribution: 'http://www.andrewt.net'
		});
	layer.drawTile = function(canvas, tilePoint, zoom) {
		zoom = complexPlane.getZoom();
		var side = settings.tileSide / Math.pow(settings.zoomfactor, zoom);
	    benoir.do({
	    	xi: tilePoint.x * side,
	    	yi: tilePoint.y * side,
	    	step: side / canvas.width,
	    	width: canvas.width,
	    	height: canvas.height
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
	    //crs: L.CRS.Simple
	});

	complexPlane.addLayer(layer);
});
