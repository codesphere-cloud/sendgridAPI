const fs = require('fs');
const ndjson = require('ndjson');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');


function chunkArray(array, chunkSize) {
  let results = [];
  while (array.length) {
    results.push(array.splice(0, chunkSize));
  }

  return results;
}

let data = [];
let emailGroups = [];

function processAllContacts(chunkSize) {
  return new Promise((resolve, reject) => {

    const db = new sqlite3.Database('./server/data/contacts.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log('Connected to the database.');
        const sql = `SELECT email FROM contacts`;

        db.all(sql, [], (err, rows) => {
          if (err) {
            console.error(err.message);
            reject(err);
          } else {
            const emailGroups = chunkArray(rows.map(row => row.email), chunkSize);
            console.log("new data array", emailGroups);
            resolve(emailGroups); // Resolve the promise with emailGroups
          }
        });
      }
    });
  });
}


function generateTaskSetId() {
  const taskSetId = uuidv4();
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const currentTime = new Date().toISOString().slice(11, 19).replace(/:/g, '');

  return taskSetId + currentDate + currentTime;
}

function getDatabaseConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./server/data/contacts.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log('Connected to the database.');
        resolve(db);
      }
    });
  });
}

async function getSequenceTemplateBySeqId(sequenceId) {
  const db = await getDatabaseConnection();

  const sql = `SELECT * FROM sequence_tasks_template WHERE sequence_id = ?`;

  return new Promise((resolve, reject) => {
    db.all(sql, [sequenceId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function getScheduledTasksBySetId(setId) {
  const db = await getDatabaseConnection();

  const sql = `SELECT * FROM automation_tasks WHERE task_set_id = ?`;

  return new Promise((resolve, reject) => {
    db.all(sql, [setId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  })
}

async function getContactById(contactId) {
  const db = await getDatabaseConnection();

  try {
    const sql = `SELECT * FROM contacts WHERE id = ?`;
    const rows = await new Promise((resolve, reject) => {
      db.all(sql, [contactId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    return rows;
  } finally {
    db.close();
  }
}

async function getContactsBySubgroupId(subgroupId) {
  const db = await getDatabaseConnection();

  const sql = `SELECT * FROM contacts WHERE id IN (SELECT contact_id FROM contact_subgroup WHERE subgroup_id = ?)`;

  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(sql, [subgroupId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    db.close();

    return rows;
  } catch (err) {
    throw err;
  }
}

async function getAllContacts() {
  const db = await getDatabaseConnection();

  const sql = `SELECT * FROM contacts`;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  })
}

async function getLastCompletedTask(taskSetId) {
  const db = await getDatabaseConnection();

  const sql = `SELECT * FROM automation_tasks WHERE task_set_id = ? AND status = 'completed' ORDER BY order_position DESC LIMIT 1`;

  return new Promise((resolve, reject) => {
    db.get(sql, [taskSetId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  })
}

async function scheduleNextTask(lastCompletedTask, currentTask) {
  if (!lastCompletedTask || !lastCompletedTask.completed_at) {
    return { dueTime: new Date().toISOString(), status: "pending" };
  }

  const lastCompletedAtTimestamp = parseInt(lastCompletedTask.completed_at, 10);
  const lastCompletedAt = new Date(lastCompletedAtTimestamp);
  const delayDuration = currentTask.delay * 1000;
  const dueTime = new Date(lastCompletedAt.getTime() + delayDuration);
  const status = "pending";

  const db = await getDatabaseConnection();

  const sql = `UPDATE automation_tasks SET due_time = ?, status = ? WHERE id = ?`;

  return new Promise((resolve, reject) => {
    db.run(sql, [dueTime.getTime(), status, currentTask.id], (err) => {
      if (err) {
        reject(err);
      } else {
        // Fetch the updated row data
        const fetchSql = `SELECT * FROM automation_tasks WHERE id = ?`;
        db.get(fetchSql, [currentTask.id], (fetchErr, row) => {
          if (fetchErr) {
            reject(fetchErr);
          } else {
            resolve(row);
          }
        });
      }
    });
  });
}


async function getSequenceById(sequenceId) {
  const db = await getDatabaseConnection();

  let sql = "SELECT * FROM automation_sequences WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.get(sql, [sequenceId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  })
}

async function createAutomationTask(sequenceId, contactId, subgroupId, templateId, orderPosition, delay, taskSetId, dueTime, status) {
  const db = await getDatabaseConnection();

  const sql = "INSERT INTO automation_tasks (sequence_id, contact_id, subgroup_id, template_id, order_position, delay, task_set_id, due_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

  return new Promise((resolve, reject) => {
    db.run(sql, sequenceId, contactId, subgroupId, templateId, orderPosition, delay, taskSetId, dueTime, status, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function completeTask(taskId, completedTimestamp) {
  const db = await getDatabaseConnection();

  const sql = "UPDATE automation_tasks SET (status, completed_at) = ('completed', ?) WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.run(sql, completedTimestamp, taskId, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}

async function getTaskById(taskId) {
  const db = await getDatabaseConnection(); 

  const sql = `SELECT * FROM automation_tasks WHERE id = ?`;

  return new Promise((resolve, reject) => {
    db.get(sql, [taskId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  })
}


module.exports = {
  processAllContacts,
  generateTaskSetId,
  getDatabaseConnection,
  getSequenceTemplateBySeqId,
  getScheduledTasksBySetId,
  getContactById,
  getContactsBySubgroupId,
  getAllContacts,
  getLastCompletedTask,
  getSequenceById,
  createAutomationTask,
  completeTask,
  scheduleNextTask,
  getTaskById
};
