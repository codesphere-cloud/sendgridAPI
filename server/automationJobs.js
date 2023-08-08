const {
    getSequenceTemplateBySeqId,
    createAutomationTask,
    generateTaskSetId,
    getScheduledTasksBySetId,
    getContactById,
    completeTask,
    scheduleNextTask,
    getTaskById
} = require('./utils');
const { sendSingleEmail } = require('./api');
const { scheduleBullTask } = require('./bullmq/queue');


async function createTasksFromSeqId(sequenceId, contactId) {
    const taskSetId = generateTaskSetId();

    let sequenceTemplate;
    try {
        sequenceTemplate = await getSequenceTemplateBySeqId(sequenceId);
        sequenceTemplate.sort((a, b) => a.order_position - b.order_position);
    } catch (error) {
        console.error("Error fetching sequence template:", error);
    }

    for (let i = 0; i < sequenceTemplate.length; i++) {
        const task = sequenceTemplate[i];
        let dueTime;
        let status;

        if (i === 0) {
            // The first task
            dueTime = new Date(); // Set to "now"
            status = "pending";
        } else {
            dueTime = null; // Or whatever placeholder you want to use to indicate it's not scheduled yet
            status = "unscheduled";
        }

        await createAutomationTask(
            task.sequence_id,
            contactId,
            task.subgroup_id,
            task.template_id,
            task.order_position,
            task.delay,
            taskSetId,
            dueTime,
            status
        );
    }

    return taskSetId;
}

async function sendTasks(taskSetId) {
  try {
    const scheduledTasks = await getScheduledTasksBySetId(taskSetId);
    scheduledTasks.sort((a, b) => a.order_position - b.order_position);

    for (let i = 0; i < scheduledTasks.length; i++) {
      const currentTask = scheduledTasks[i];

      if (currentTask.status === "pending" && currentTask.due_time <= Date.now()) {
        const contactData = await getContactById(currentTask.contact_id);

        try {
          console.log("Sending email to:", contactData[0].email);
          await sendSingleEmail(contactData[0].email, currentTask.template_id);
          await completeTask(currentTask.id, Date.now());
          console.log("Task completed in SQL db");
        } catch (error) {
          console.error("Error sending email:", error);
          continue;
        }

        const nextTask = scheduledTasks[i + 1];
        if (nextTask && nextTask.status === "unscheduled") {
          const completedTask = await getTaskById(currentTask.id);
          const updatedTask = await scheduleNextTask(completedTask, nextTask);
          const scheduledTaskData = {
            sequence_id: updatedTask.sequence_id,
            contact_id: updatedTask.contact_id,
            subgroup_id: updatedTask.subgroup_id,
            template_id: updatedTask.template_id,
            order_position: updatedTask.order_position,
            delay: updatedTask.delay,
            task_set_id: updatedTask.task_set_id,
            dueTime: updatedTask.due_time,
            status: updatedTask.status
          };

          const delay = nextTask.delay * 1000;
          await scheduleBullTask(scheduledTaskData, delay);
        }

        break;
      }
    }
  } catch (error) {
    console.error("Error fetching scheduled tasks:", error);
  }
}

module.exports = {
    createTasksFromSeqId,
    sendTasks
}