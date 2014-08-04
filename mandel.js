var c, ctx, width, height;
var x, y, step, maxcol = 200, maxr = 5;
var maxcolmult = 1.5, maxmaxcol = 3000;
var timer, zoomfactor = 2, zoomdelay = 0.3; //seconds
var calculating = false;
var benoir = new Worker('benoir.js'), im, benoirStarted, benoirsLastJob;

function init()
{
	// initialisation
	c = document.getElementById('can');
	ctx = c.getContext("2d");
	width = $(window).width();
	height = $(window).height();
	c.width = width;
	c.height = height
	step = 2 / ((width > height) ? height : width);
	x = -(width * 0.7) * step;
	y = -(height / 2) * step;
	mandel(x, y, step, maxcol, maxr).then(domandel);

	// click to zoom
	$('#can').click(function(e) {
		if (calculating) return;
		calculating = true;
		step /= zoomfactor;
		x += e.pageX * step * (zoomfactor - 1);
		y += e.pageY * step * (zoomfactor - 1);
		maxcol *= maxcolmult;
		if (maxcol > maxmaxcol) maxcol = maxmaxcol;
		$('#maxcol').val(Math.floor(maxcol));
		var origin = e.pageX + 'px ' + e.pageY + 'px',
			tform = 'transform ' + zoomdelay + 's ease-in-out';
		Q.all([
			mandel(x, y, step, maxcol, maxr),
			zoom(zoomfactor, {x: e.pageX, y: e.pageY}, zoomdelay)
		]).then(function(results) {
			domandel(results[0]);
		});
		document.body.style.cursor = 'default';
	});

	// handling forms
	$('input').change(function() {
		var c = $(this).val();
		if ($.isNumeric(c))
			eval($(this).attr('id') +  ' = parseFloat(c);');
		else
			$(this).val(eval($(this).attr('id')));
	});
	$('input').change();
}

function domandel(e) {
	console.log(e[0]);
	zoomdelay = (new Date() - benoirStarted) * 0.001;
	for (var i = 0; i < im.data.length; ++i)
		im.data[i] = e.data[i];
	ctx.putImageData(im, 0, 0);
	$('#can').css({
		'-webkit-transition': 'none',
		'-moz-transition': 'none',
		'-o-transition': 'none',
		'-ms-transition': 'none',
		'transition': 'none',
		'-webkit-transform': 'none',
		'-moz-transform': 'none',
		'-o-transform': 'none',
		'-ms-transform': 'none',
		'transform': 'none'
	});
	document.body.style.cursor = 'pointer';
	calculating = false;
}

function zoom(zoomlevel, origin, zoomdelay) {
	var transition = 'transform ' + zoomdelay + 's ease-in-out',
		transform = 'scale(' + zoomlevel + ')';
	origin = origin.x + 'px ' + origin.y + 'px';
	$('#can').css({
		'-webkit-transform-origin': origin,
		'-moz-transform-origin': origin,
		'-o-transform-origin': origin,
		'-ms-transform-origin': origin,
		'transform-origin': origin,
		'-webkit-transform': transform,
		'-moz-transform': transform,
		'-o-transform': transform,
		'-ms-transform': transform,
		'transform-origin': origin,
		'-webkit-transition': '-webkit-' + transition,
		'-moz-transition': '-moz-' + transition,
		'-o-transition': '-o-' + transition,
		'-ms-transition': '-ms-' + transition,
		'transition': transition
	});
	var q = Q.delay(zoomdelay);
	q.then(function() {
	});
	return q;
}

// asynchronously calculate the result
function mandel(xi, yi, step, maxcol, maxr)
{
	im = ctx.getImageData(0, 0, c.width, c.height);

	benoirsLastJob = {
		height: im.height,
		width: im.width,
		yi: yi,
		xi: xi,
		step: step,
		maxr: maxr,
		maxcol: maxcol
	};
	return startBenoir();
}
function recalculate() {
	benoirsLastJob.maxcol = maxcol;
	benoirsLastJob.maxr = maxr;
	return startBenoir().then(domandel);
}
function startBenoir() {
	var benoirsDeferred = Q.defer(),
		handler = function (result) { 
			console.log('frame took ' + (new Date() - benoirStarted) + 'ms');
			benoirsDeferred.resolve(result); 
		};
	benoir.addEventListener('message', handler);
	benoirsDeferred.promise.then(function() {
		benoir.removeEventListener('message', handler);
	});
	benoirStarted = new Date();
	benoir.postMessage(benoirsLastJob);
	return benoirsDeferred.promise;
}

// boring ui stuff
function activate(panel) {
	if ($('.shown').attr('id') == panel)
		$('#' + panel).removeClass('shown').addClass('hidden');
	else {
		$('.shown').removeClass('shown').addClass('hidden');
		$('#' + panel).removeClass('hidden').addClass('shown');
	}
}