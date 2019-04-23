'use strict';

const mandelSettings = {
	maxr: 5,
	maxcol: 1000,
	maxcolmult: 2,
	maxmaxcol: 20000,
	tileSide: 5,
	tileSize: 256
};

document.addEventListener('DOMContentLoaded', () => {
	const mapDiv = document.getElementById('complex-plane'),
		layer = L.tileLayer.canvas({
			'async': true,
			continuousWorld: true,
			attribution: '<a href="http://www.andrewt.net">andrewt.net</a>',
			maxZoom: 42,
			maxNativeZoom: 40,
			bounds: L.latLngBounds(
				L.latLng(-Infinity, -1e30),
				L.latLng(Infinity, 1e30))
		});

	layer.drawTile = (canvas, tilePoint, zoom) => {
		// Not sure why zoom wasn't being passed in...
		zoom = complexPlane.getZoom();
		const side = mandelSettings.tileSide / Math.pow(2, zoom),
			maxcol = mandelSettings.maxcol * Math.pow(mandelSettings.maxcolmult, zoom);
		if (window.devicePixelRatio != undefined) {
			canvas.width = canvas.height = mandelSettings.tileSize * window.devicePixelRatio;
			canvas.style.width = canvas.style.height = mandelSettings.tileSize + 'px';
		}

		const shader = new GlslCanvas(canvas);
		shader.load(glsl);
		shader.setUniform('u_xi', tilePoint.x * side);
		shader.setUniform('u_yi', tilePoint.y * side);
		shader.setUniform('u_step', side / canvas.width);
		shader.setUniform('u_side', side);
		shader.setUniform('u_width', canvas.width);
		shader.setUniform('u_height', canvas.height);
		shader.setUniform('u_maxcol', (maxcol > mandelSettings.maxmaxcol)
			? mandelSettings.maxmaxcol
			: maxcol);
		shader.pause();
		layer.tileDrawn(canvas);
	};

	// Figure out the initial state from the URL and some defaults:
	let center = [0, -0.5],
		r = 2;
	if (location.hash)
		location.hash.split('#').forEach(function(bit) {
			const split = bit.indexOf('=');
			if (~split) {
				const value = bit.substr(split + 1);
				switch (bit.substr(0, split)) {
					case 'x': center[1] = value; break;
					case 'y': center[0] = value; break;
					case 'r': r = value; break;
				}
			}
		});

	const screenR = mapDiv.offsetWidth > mapDiv.offsetHeight
			? mapDiv.offsetWidth
			: mapDiv.offsetHeight,
		zoom = Math.floor(Math.log2((mandelSettings.tileSide / r) / (mandelSettings.tileSize / screenR))),
		pxRatio = mandelSettings.tileSize / mandelSettings.tileSide,
		complexPlane = L.map(mapDiv, {
			center: center.map(function (x) { return x * pxRatio }),
			zoom: zoom,
			worldCopyJump: false,
			crs: simple()
		});
	complexPlane.addLayer(layer);

	complexPlane.on('move', e => {
		const center = complexPlane.getCenter(),
			zoom = (1 << complexPlane.getZoom());
		document.getElementById('permalink').href =
			'#x=' + (center.lng / pxRatio) + 
			'#y=' + (center.lat / pxRatio) + 
			'#r=' + (mandelSettings.tileSide * screenR /
				(mandelSettings.tileSize * zoom));
	});
});

const glsl = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float u_xi; // start point x
uniform float u_yi; // start point y
uniform float u_step; // side / canvas.width
uniform float u_side;
uniform float u_width;
uniform float u_height;
uniform float u_maxcol; // maxiters i guess
uniform vec2 u_resolution;
uniform float u_time;

void main() {
	vec2 st = gl_FragCoord.xy / u_resolution.xy;

	vec2 c = vec2(u_xi, -u_yi) + (gl_FragCoord.xy - vec2(0., u_height)) * u_step;

	vec2 z = c;
	for (float iters = 0.0; iters < 1000000000.; ++iters) {
		if (dot(z, z) > 4.0) {
			// todo: colours:
			gl_FragColor = vec4(1.0);
			return;
		}

		z = vec2(
			z.x * z.x - z.y * z.y,
			2.0 * z.x * z.y
		) + c;

		if (iters > u_maxcol) {
			gl_FragColor = vec4(sin(u_time * 0.002), 0., 0., 1.0);
			return;
		}
	}
}
`;
