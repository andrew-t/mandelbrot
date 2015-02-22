function WorkerManager(fn) {
	var worker = new Worker(fn),
		processing = false,
		queue = [];
	this.maxQueueLength = 1;
	this.defaults = {};

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
				queue.shift().d.reject(Benoir.QueueFull);
			// Enqueue our new task.
			queue.push(task);
		}
		return task.d.promise;
	}

	function run(task) {
		processing = true;
		var handler = function(e) {
			console.log('returned');
			worker.removeEventListener('message', handler);
			processing = false;
			if (queue.length)
				run(queue.shift());
			task.d.resolve(e.data);
		};
		worker.addEventListener('message', handler);
		for (key in self.defaults)
			if (task.params[key] === undefined)
				task.params[key] = self.defaults[key];
		console.log('calling worker');
		worker.postMessage(task.params);
		return task.d.promise;
	}

	function extend(a, b) {
		return a;
	}
}
WorkerManager.QueueFull = {};