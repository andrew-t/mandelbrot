'use strict';

const glsl = `
#ifdef GL_ES
precision highp float;
#endif

uniform float u_xi; // start point x
uniform float u_yi; // start point y
uniform float u_step; // side / canvas.width
uniform float u_side;
uniform float u_width;
uniform float u_height;
uniform float u_maxcol; // maxiters i guess
// uniform vec2 u_resolution;
// uniform float u_time;

void main() {
	vec2 c = vec2(u_xi, -u_yi) + (gl_FragCoord.xy - vec2(0., u_height)) * u_step;

	vec2 z = c;
	for (float iters = 0.0; iters < 1000000000.; ++iters) {
		if (dot(z, z) > 4.0) {

			float c = mod(iters / 20.0, 2.0);
			if (c > 1.0) {
				c -= 1.0;
				gl_FragColor = vec4(
					1.0 - pow(c, 2.0),
					1.0 - c,
					0.2 + 0.8 * (1.0 - c),
					1.0);
			}
			else {
				gl_FragColor = vec4(
					pow(c, 2.0),
					c,
					0.2 + 0.8 * c,
					1.0);
			}

			return;
		}

		z = vec2(
			z.x * z.x - z.y * z.y,
			2.0 * z.x * z.y
		) + c;

		if (iters > u_maxcol) {
			gl_FragColor = vec4(0., 0., 0., 1.0);
			return;
		}
	}
}
`;


const mandelSettings = {
	maxr: 2,
	maxcol: 700,
	maxcolmult: 1.5,
	maxmaxcol: 10000,
	tileSide: 5,
	tileSize: 256
};

const shaders = [];
for (let i = 0; i < 16; ++i) {
	const canvas = document.createElement('canvas');
	canvas.width = mandelSettings.tileSize;
	canvas.height = mandelSettings.tileSize;
	const shader = new GlslCanvas(canvas);
	shader.load(glsl);
	shader.setUniform('u_width', canvas.width);
	shader.setUniform('u_height', canvas.height);
	shader.pause();
	shaders.push({ shader, canvas });
}

let rendering = 0, nextShader = 0;
function getShader() {
	const shader = shaders[nextShader++];
	if (nextShader >= shaders.length)
		nextShader = 0;
	return shader;
}
const renderQueue = [];
function resumeRender() {
	if (--rendering < 5) {
		const next = renderQueue.shift();
		if (next) {
			++rendering;
			next(getShader());
		}
	}
}
function enqueueRender(fn) {
	if (rendering < 16) {
		++rendering;
		fn(getShader());
	} else {
		renderQueue.push(fn);
	}
}

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

	layer.drawTile = (tileCanvas, tilePoint, zoom) => {
		// Not sure why zoom wasn't being passed in...
		zoom = complexPlane.getZoom();
		const side = mandelSettings.tileSide / Math.pow(2, zoom),
			maxcol = mandelSettings.maxcol * Math.pow(mandelSettings.maxcolmult, zoom);
		if (window.devicePixelRatio != undefined) {
			tileCanvas.width = tileCanvas.height = mandelSettings.tileSize * window.devicePixelRatio;
			tileCanvas.style.width = tileCanvas.style.height = mandelSettings.tileSize + 'px';
		}

		enqueueRender(({ shader, canvas }) => {
			shader.setUniform('u_xi', tilePoint.x * side);
			shader.setUniform('u_yi', tilePoint.y * side);
			shader.setUniform('u_step', side / tileCanvas.width);
			shader.setUniform('u_side', side);
			shader.setUniform('u_maxcol', (maxcol > mandelSettings.maxmaxcol)
				? mandelSettings.maxmaxcol
				: maxcol);
			shader.on('render', finalise);
			shader.play();
			let done = false;
			function finalise() {
				if (done) return;
				done = true;
				shader.off('render', finalise);
				shader.pause();
				setTimeout(() => {
					tileCanvas.getContext('2d')
						.drawImage(canvas, 0, 0);
					layer.tileDrawn(tileCanvas);
					resumeRender();
				}, 25);
			}
		});
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
