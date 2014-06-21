var c, ctx, width, height;
var x, y, step, maxcol = 200, maxr = 5;
var maxcolmult = 1.5, maxmaxcol = 3000;
var timer, zoomfactor = 2, zoomdelay = 0.3; //seconds
var calculating = false;
var benoir = new Worker('benoir.js'), benoirsPromise, im, benoirStarted, benoirsLastJob;

function init()
{
	// initialisation
	benoir.addEventListener('message', function (result) { benoirsPromise.fulfil(result); });
	c = document.getElementById('can');
	ctx = c.getContext("2d");
	start();

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
		$('#can').css({
			'-webkit-transform-origin': origin,
			'-moz-transform-origin': origin,
			'-o-transform-origin': origin,
			'-ms-transform-origin': origin,
			'transform-origin': origin,
			'-webkit-transition': '-webkit-' + tform,
			'-moz-transition': '-moz-' + tform,
			'-o-transition': '-o-' + tform,
			'-ms-transition': '-ms-' + tform,
			'transition': tform
		});
		zoom(zoomfactor);
		mandel(x, y, step, maxcol, maxr);
		if (timer !== undefined) clearTimeout(timer);
		timer = setTimeout(function() { domandel(); }, zoomdelay * 1000);
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

function start() {
	width = $(window).width();
	height = $(window).height();
	c.width = width;
	c.height = height
	step = 2 / ((width > height) ? height : width);
	x = -(width * 0.7) * step;
	y = -(height / 2) * step;
	mandel(x, y, step, maxcol, maxr);
	domandel();
}

function zoom(zoomlevel) {
	var tform = 'scale(' + zoomlevel + ')';
	$('#can').css({
		'-webkit-transform': tform,
		'-moz-transform': tform,
		'-o-transform': tform,
		'-ms-transform': tform,
		'transform': tform
	});
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
	startBenoir();
}
function recalculate() {
	benoirsLastJob.maxcol = maxcol;
	benoirsLastJob.maxr = maxr;
	startBenoir();
	domandel();
}
function startBenoir() {
	benoirsPromise = new Promise();
	benoirStarted = new Date();
	benoir.postMessage(benoirsLastJob);
}
function domandel() {
	$('#can').css({
		'-webkit-transition': 'none',
		'-moz-transition': 'none',
		'-o-transition': 'none',
		'-ms-transition': 'none',
		'transition': 'none'
	});
	benoirsPromise.then(function (e) {
		zoomdelay = (new Date() - benoirStarted) * 0.001;
		for (var i = 0; i < im.data.length; ++i)
			im.data[i] = e.data[i];
		ctx.putImageData(im, 0, 0);
		zoom(1);
		document.body.style.cursor = 'pointer';
		calculating = false;
	});
};

// boring ui stuff
function activate(panel) {
	if ($('.shown').attr('id') == panel)
		$('#' + panel).removeClass('shown').addClass('hidden');
	else {
		$('.shown').removeClass('shown').addClass('hidden');
		$('#' + panel).removeClass('hidden').addClass('shown');
	}
}