function simple() {
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
	return L.CRS.Simple;
}
