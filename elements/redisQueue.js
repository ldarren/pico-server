const
KEY_QUEUE= 'lPicoQ:',
KEY_WORKER = 'lPicoQWorker:'

var
queueId = function(queue){ return KEY_QUEUE+queue.id },
workerId = function(queue){ return KEY_WORKER+queue.workerId },
Queue = module.exports = {
    id:'testQueue',
    workerId:'testWorker',
    client: null,
}

Queue.prototype = {
    setup: function(queueId, workerId, redisClient){
        this.id = queueId
        this.workerId = workerId
        this.client = redisClient
    },
    push: function(str, cb){
        this.client.lpush(str, getQueueId(this), cb)
    },
    pop: function(cb){
        this.client.rpoplpush(getQueueId(this), getWorkerId(this), cb)
    },
    done: function(cb){
        this.client.lrem(getWorkerId(this), cb)
    },
    abort: function(cb){
        this.client.rpoplpush(getWorkerId(this), getQueueId(this), cb)
    },
    length: function(cb){
        this.client.llen(getQueueId(this), cb)
    }
}
