'use strict';

var settings = {
		maxr: 5,
		maxcol: 3000,
		zoomfactor: 2,
		tileSide: 1
	},
	benoir = new WorkerManager('benoir.js');
benoir.defaults = settings;
benoir.maxQueueLength = 100;

document.addEventListener('DOMContentLoaded', function() {
	var mapDiv = document.getElementById('complex-plane'),
		layer = L.tileLayer.canvas({
			async: true,
			continuousWorld: true,
			noWrap: true,
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

	// This should be defined by Leaflet, but somehow isn't?
	L.CRS.Simple = Object.create(L.CRS);
	L.CRS.Simple.projection = L.Projection.LonLat;
	L.CRS.Simple.transformation = new L.Transformation(1, 0, -1, 0);
	L.CRS.Simple.scale = function (zoom) {
		return Math.pow(2, zoom);
	};
	L.CRS.Simple.distance = function (latlng1, latlng2) {
		var dx = latlng2.lng - latlng1.lng,
		    dy = latlng2.lat - latlng1.lat;
		return Math.sqrt(dx * dx + dy * dy);
	};
	L.CRS.Simple.infinite = true;

	var complexPlane = L.map(mapDiv, {
	    center: [0, 0],
	    zoom: 0,
	    crs: L.CRS.Simple
	});

	complexPlane.addLayer(layer);
});
