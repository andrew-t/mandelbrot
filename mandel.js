document.addEventListener('DOMContentLoaded', function() {
	var benoir = new Worker('benoir.js'), c, ctx, im, benoirsLastJob,
		x, y, step, maxcol = 200, maxr = 5,
		maxcolmult = 1.5, maxmaxcol = 3000,
		zoomfactor = 2, zoomdelay = 0.3; //seconds

	// initialisation
	c = document.getElementById('can');
	c.width = c.offsetWidth;
	c.height = c.offsetHeight;
	ctx = c.getContext("2d");
	im = ctx.getImageData(0, 0, c.width, c.height);

	function domandel(e) {
		if (window['Uint8ClampedArray'])
			im.data.set(e.data);
		else for (var i = 0; i < im.data.length; ++i)
			im.data[i] = e.data[i];
		ctx.putImageData(im, 0, 0);
		c.style.transition = 'none';
		c.style.transform = 'none';
		c.style.cursor = 'pointer';
	}

	function zoom(zoomlevel, origin, zoomdelay) {
		c.style.transition = 'transform ' + zoomdelay + 's ease-in-out';
		c.style.transform = 'scale(' + zoomlevel + ')';
		c.style.transformOrigin = origin.x + 'px ' + origin.y + 'px';
		return Q.delay(zoomdelay * 1000);
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
			maxr: maxr,
			maxcol: maxcol
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

		step /= zoomfactor;
		x += e.pageX * step * (zoomfactor - 1);
		y += e.pageY * step * (zoomfactor - 1);

		maxcol *= maxcolmult;
		if (maxcol > maxmaxcol) maxcol = maxmaxcol;
		document.getElementById('maxcol').value = Math.floor(maxcol);

		var origin = e.pageX + 'px ' + e.pageY + 'px',
			tform = 'transform ' + zoomdelay + 's ease-in-out',
			started = new Date();
		Q.all([
			startBenoir(benoirsLastJob = {
				height: im.height,
				width: im.width,
				yi: y,
				xi: x,
				step: step,
				maxr: maxr,
				maxcol: maxcol
			}),
			zoom(zoomfactor, {x: e.pageX, y: e.pageY}, zoomdelay)
		]).then(function(results) {
			domandel(results[0]);
			calculating = false;
			zoomdelay = (new Date() - started) * 0.001;
			console.log('frame took ' + zoomdelay + 'ms');
		});
		c.style.cursor = 'default';
	});

	function forEachChild(parent, callback) {
		var children = parent.children;
		for (var i = 0; i < children.length; ++i)
			callback(children[i]);
	}

	// handling forms
	forEachChild(document.getElementById('settings'), function(child) {
		var handler = function() {
			if (child.tagName === 'INPUT') {
				if (child.value && /^[0-9]*(\.[0-9]+)?$/.test(child.value))
					eval(child.id +  ' = parseFloat(child.value || "0");');
				else
					child.value = eval(child.id);
			}
		};
		child.addEventListener('change', handler);
		handler();
	});

	document.getElementById('menu').addEventListener('click', function(e) {
		e.preventDefault();
		document.body.classList.toggle('menu');
	});

	forEachChild(document.getElementById('tabs'), function(node) {
		node.addEventListener('click', function(e) {
			e.preventDefault();
			forEachChild(document.getElementById('controls'), function(node2) {
				if (node2.id !== 'tabs')
					node2.classList[node2.id === node.dataset.id ? 'remove' : 'add']('hidden');
			});
			forEachChild(document.getElementById('tabs'), function(node2) {
				node2.classList[node2.dataset.id === node.dataset.id ? 'add' : 'remove']('active');
			});
		});
	});

	document.getElementById('recalculate').addEventListener('click', function() {
		benoirsLastJob.maxcol = maxcol;
		benoirsLastJob.maxr = maxr;
		return startBenoir(benoirsLastJob).then(domandel);
	});

	document.getElementById('restart').addEventListener('click', function() {
		init();
	});
});