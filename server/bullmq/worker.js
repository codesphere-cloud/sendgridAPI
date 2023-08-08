const { Worker } = require('bullmq');

const { sendTasks } = require("../automationJobs")

//Initialize Worker for handling
const taskProcessorWorker = new Worker("taskQueue", async (job) => {
    const taskData = job.data;
    console.log("taskProcessorWorker is doing sth!", "taskData:", taskData);

    await sendTasks(taskData.task_set_id);

    console.log("sent email for task with task_set_id:", taskData.task_set_id);

    //mark the job as completed
    return {
        id: taskData.id,
        sequence_id: taskData.sequence_id,
        status: "completed"
    };
}, {
    connection: {
        host: "127.0.0.1",
        port: 6379
    }
})

taskProcessorWorker.on('completed', (job) => {
    console.log(`Job ${job.id}  Completed`);
})

taskProcessorWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error ${err.message}`);
});