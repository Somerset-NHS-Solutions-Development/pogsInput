const Transport = require('winston-transport');
const util = require('util');

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
module.exports = class InMemoryLogTransport extends Transport {
  constructor(opts) {
    super(opts);
		this.max = 100;
    this.index = 0;
		this.lock = false;
		if(opts.max && !isNaN(opts.max)) {
			this.max = opts.max;
		}

		if(opts.level) {
			this.level = opts.level;
		}

		this.queue = new Array(this.max);
    this.cache = [];
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

		this.queue[this.index++] = info;

    if(this.index >= this.max) {
      this.index = 0;
    }

    callback();
  }

	getLogAsync(nLines) {
		return new Promise((resolve, reject) => {

			if(nLines > this.max) {
				nLines = this.max;
			}

      const temp = [...this.queue];
      let cIndex = this.index;
      let linear = [];
      for(let i = cIndex; i < this.max; i++) {
          if(temp[i] != undefined) {
            linear.push(temp[i])
          }
      }

      for(let i = 0; i < cIndex; i++) {
          if(temp[i] != undefined) {
            linear.push(temp[i])
          }
      }

      if(linear.length <= nLines) {
        return resolve(linear);
      }

      return resolve(linear.splice(0, nLines));
		}).catch((ex) => {
      return ['Error in log cache'];
		});
	}
};
