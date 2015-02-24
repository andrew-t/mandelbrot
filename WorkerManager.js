function WorkerManager(fn, options) {
	var worker = new Worker(fn),
		processing = false,
		queue = [],
		self = this;
	if (!options) options = {};
	this.maxQueueLength = 1;
	this.defaults = {};
	worker.addEventListener('message', function(e) {
		if (e.data.debug)
			console.log(e.data.message);
	});

	this.do = function(params) {
		var task = {
				params: params,
				d: Q.defer()
			};
		if (!processing)
			run(task);
		else {
			// If the queue is full, kill the oldest task.
			if (queue.length >= this.maxQueueLength)
				queue.shift().d.reject(WorkerManager.QueueFull);
			// Enqueue our new task.
			queue.push(task);
		}
		return task.d.promise;
	}

	function run(task) {
		processing = true;
		var handler = function(e) {
			if (e.data.debug)
				return;
			worker.removeEventListener('message', handler);
			processing = false;
			if (queue.length)
				run(queue[options.stack ? 'pop' : 'shift']());
			task.d.resolve(e.data);
		};
		worker.addEventListener('message', handler);
		for (key in self.defaults)
			if (!task.params.hasOwnProperty(key))
				task.params[key] = self.defaults[key];
		worker.postMessage(task.params);
		return task.d.promise;
	}

	function extend(a, b) {
		return a;
	}
}
WorkerManager.QueueFull = {};