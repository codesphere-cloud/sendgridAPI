const { Queue } = require('bullmq');

//initialize new Queue
const taskQueue = new Queue("taskQueue", {
    connection: {
        host: "127.0.0.1",
        port: 6379
    }
});

//New Task is scheduled
async function scheduleBullTask(taskData, delay) {
    await taskQueue.add('myJobName', {
        sequence_id: taskData.sequence_id,
        contact_id: taskData.contact_id,
        subgroup_id: taskData.subgroup_id,
        template_id: taskData.template_id,
        order_position: taskData.order_position,
        delay: taskData.delay,
        task_set_id: taskData.task_set_id,
        dueTime: taskData.dueTime,
        status: taskData.status
    },
        {
            delay: delay
        });
}




module.exports = {
    scheduleBullTask
}