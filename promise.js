var Promise = function() {
	var _this = this;
	var _done = [];
	var _fail = [];
	var _data;
	var _err;

	this.then = function(f) {
		var p = new Promise();

		if (_data === undefined)
			_done.push(function(data) {
			p.fulfil(f(data));
		});
		else
		p.fulfil(f(_data));

		return p;
	};

	this.onfail = function(f) {
		var p = new Promise();

		if (_err === undefined)
			_fail.push(function(data) {
			p.fulfil(f(data));
		});
		else
			p.fail(f(_err));

		return p;
	};

	this.fulfil = function(data) {
		_data = data;
		_err = undefined;
		var f;
		while (f = _done.pop())
			f(data);
	};

	this.fail = function(msg) {
		_err = msg;
		_data = undefined;
		var f;
		while (f = _fail.pop())
			f(msg);
	};
}

function HttpPromise(url) {
	var p = new Promise();
	var req = new XMLHttpRequest();
	req.onload = function(data) {
		data = data.target.response;
		console.log(data);
		p.fulfil(data);
	}
	req.onerror = p.fail;
	req.open("get", url, true);
	req.send();
	return p;
}
	
function HttpJsonPromise(url) {
	var p = new Promise();
	var req = new XMLHttpRequest();
	req.onload = function(data) {
		data = data.target.response;
		console.log(data);
		p.fulfil(JSON.parse(data));
	}
	req.onerror = p.fail;
	req.open("get", url, true);
	req.send();
	return p;
}