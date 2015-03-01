function WorkerManager(fn, options) {
	var workers = [],
		queue = [],
		self = this;
	if (!options) options = {};
	this.maxQueueLength = 1;
	this.defaults = {};
	for (var i = 0; i < (options.threads  || 1); ++i) {
		var worker = new Worker(fn);
		worker.addEventListener('message', function(e) {
			if (e.data.debug)
				console.log(e.data.message);
		});
		worker.busy = false;
		workers.push(worker);
	}

	this.do = function(params) {
		var task = {
				params: params,
				d: Q.defer()
			},
			worker;
		for (var i = 0; i < workers.length; ++i)
			if (!workers[i].busy)
				worker = workers[i];
		if (worker)
			run(task, worker);
		else {
			// If the queue is full, kill the oldest task.
			if (queue.length >= this.maxQueueLength)
				queue.shift().d.reject(WorkerManager.QueueFull);
			// Enqueue our new task.
			queue.push(task);
		}
		return task.d.promise;
	}

	function run(task, worker) {
		worker.busy = true;
		var handler = function(e) {
			if (e.data.debug)
				return;
			worker.removeEventListener('message', handler);
			worker.busy = false;
			if (queue.length)
				run(queue[options.stack ? 'pop' : 'shift'](), worker);
			task.d.resolve(e.data);
		};
		worker.addEventListener('message', handler);
		for (key in self.defaults)
			if (!task.params.hasOwnProperty(key))
				task.params[key] = self.defaults[key];
		worker.postMessage(task.params);
		return task.d.promise;
	}
}
WorkerManager.QueueFull = {};