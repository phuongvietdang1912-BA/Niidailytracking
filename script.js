const API_URL = "https://script.google.com/macros/s/AKfycbxefHDAc4f_grZoSNTmhhcNKbgjbjvAV7QD0BUpo7M-m1TU-wnhvcvfVqtpakTZio1dvw/exec";

const projectName = document.getElementById("projectName");
const taskName = document.getElementById("taskName");
const taskDate = document.getElementById("taskDate");
const deadline = document.getElementById("deadline");
const status = document.getElementById("status");
const priority = document.getElementById("priority");
const notes = document.getElementById("notes");

const taskLink = document.getElementById("taskLink");
const taskFile = document.getElementById("taskFile");

const addTaskBtn = document.getElementById("addTaskBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const filterDate = document.getElementById("filterDate");

const taskList = document.getElementById("taskList");
const carryoverList = document.getElementById("carryoverList");

const formTitle = document.getElementById("formTitle");

const totalTasks = document.getElementById("totalTasks");
const doneTasks = document.getElementById("doneTasks");
const progressTasks = document.getElementById("progressTasks");
const revisionTasks = document.getElementById("revisionTasks");

const today = new Date().toISOString().split("T")[0];
taskDate.value = today;
filterDate.value = today;

let editingTaskId = null;

addTaskBtn.addEventListener("click", handleSubmit);
filterDate.addEventListener("change", renderTasks);
cancelEditBtn.addEventListener("click", resetForm);

function getTasks() {
  return JSON.parse(localStorage.getItem("designerTasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("designerTasks", JSON.stringify(tasks));
}

function handleSubmit() {
  if (editingTaskId) {
    updateTask();
  } else {
    addTask();
  }
}

function addTask() {
  const newTask = {
    id: Date.now(),
    projectName: projectName.value.trim(),
    taskName: taskName.value.trim(),
    taskDate: taskDate.value,
    deadline: deadline.value,
    status: status.value,
    priority: priority.value,
    notes: notes.value.trim(),
    link: taskLink.value.trim(),
    file: taskFile.value.trim()
  };

  if (!newTask.projectName || !newTask.taskName || !newTask.taskDate) {
    alert("Please enter project name, task name, and date.");
    return;
  }

  const tasks = getTasks();
  tasks.push(newTask);
  saveTasks(tasks);
  resetForm();
  renderTasks();
}

function updateTask() {
  const updatedProjectName = projectName.value.trim();
  const updatedTaskName = taskName.value.trim();
  const updatedTaskDate = taskDate.value;

  if (!updatedProjectName || !updatedTaskName || !updatedTaskDate) {
    alert("Please enter project name, task name, and date.");
    return;
  }

  const tasks = getTasks().map(task => {
    if (task.id === editingTaskId) {
      return {
        ...task,
        projectName: updatedProjectName,
        taskName: updatedTaskName,
        taskDate: updatedTaskDate,
        deadline: deadline.value,
        status: status.value,
        priority: priority.value,
        notes: notes.value.trim(),
        link: taskLink.value.trim(),
        file: taskFile.value.trim()
      };
    }
    return task;
  });

  saveTasks(tasks);
  resetForm();
  renderTasks();
}

function editTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingTaskId = id;

  projectName.value = task.projectName;
  taskName.value = task.taskName;
  taskDate.value = task.taskDate;
  deadline.value = task.deadline || "";
  status.value = task.status;
  priority.value = task.priority;
  notes.value = task.notes || "";
  taskLink.value = task.link || "";
  taskFile.value = task.file || "";

  formTitle.textContent = "Edit Task";
  addTaskBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden-btn");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  editingTaskId = null;

  projectName.value = "";
  taskName.value = "";
  taskDate.value = today;
  deadline.value = "";
  status.value = "To Do";
  priority.value = "Low";
  notes.value = "";
  taskLink.value = "";
  taskFile.value = "";

  formTitle.textContent = "Add New Task";
  addTaskBtn.textContent = "Add Task";
  cancelEditBtn.classList.add("hidden-btn");
}

function deleteTask(id) {
  const tasks = getTasks().filter(task => task.id !== id);
  saveTasks(tasks);

  if (editingTaskId === id) {
    resetForm();
  }

  renderTasks();
}

function toggleDone(id) {
  const tasks = getTasks().map(task => {
    if (task.id === id) {
      task.status = task.status === "Done" ? "To Do" : "Done";
    }
    return task;
  });

  saveTasks(tasks);
  renderTasks();
}

function moveTaskToToday(id) {
  const tasks = getTasks().map(task => {
    if (task.id === id) {
      return {
        ...task,
        taskDate: today
      };
    }
    return task;
  });

  saveTasks(tasks);
  filterDate.value = today;
  renderTasks();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function createTaskCard(task, isCarryover = false) {
  const isOverdue =
    task.deadline &&
    task.status !== "Done" &&
    task.deadline < today;

  const safeNotes = task.notes ? escapeHtml(task.notes) : "";
  const safeFile = task.file ? escapeHtml(task.file) : "";

  const card = document.createElement("div");
  card.className = `task-card ${task.priority.toLowerCase()}`;

  card.innerHTML = `
    <div class="task-top">
      <div>
        <div class="task-title ${task.status === "Done" ? "done-text" : ""}">
          ${escapeHtml(task.taskName)}
        </div>
        <div class="task-project">Project: ${escapeHtml(task.projectName)}</div>
      </div>
      <div><strong>${escapeHtml(task.status)}</strong></div>
    </div>

    <div class="task-meta">
      <div><strong>Date:</strong> ${escapeHtml(task.taskDate)}</div>
      <div><strong>Deadline:</strong> ${task.deadline ? escapeHtml(task.deadline) : "-"}</div>
      <div><strong>Priority:</strong> ${escapeHtml(task.priority)}</div>
      <div>${isOverdue ? '<span class="overdue">Overdue</span>' : ""}</div>
    </div>

    ${safeNotes ? `<div class="task-notes">${safeNotes}</div>` : ""}

    ${(task.link || safeFile) ? `
      <div class="task-extra">
        ${task.link ? `<div><strong>Link:</strong> <a href="${task.link}" target="_blank" rel="noopener noreferrer">${escapeHtml(task.link)}</a></div>` : ""}
        ${safeFile ? `<div style="margin-top:6px;"><strong>File:</strong> ${safeFile}</div>` : ""}
      </div>
    ` : ""}

    <div class="task-actions">
      <button class="small-btn" onclick="toggleDone(${task.id})">
        ${task.status === "Done" ? "Mark To Do" : "Mark Done"}
      </button>
      <button class="small-btn edit-btn" onclick="editTask(${task.id})">
        Edit
      </button>
      ${isCarryover ? `
        <button class="small-btn" onclick="moveTaskToToday(${task.id})">
          Move Task to Today
        </button>
      ` : ""}
      <button class="small-btn delete-btn" onclick="deleteTask(${task.id})">
        Delete
      </button>
    </div>
  `;

  return card;
}

function renderTasks() {
  const selectedDate = filterDate.value;
  const tasks = getTasks();

  const selectedDateTasks = tasks.filter(task => task.taskDate === selectedDate);

  const previousUnfinishedTasks = tasks.filter(task =>
    task.taskDate < selectedDate && task.status !== "Done"
  );

  taskList.innerHTML = "";
  carryoverList.innerHTML = "";

  if (selectedDateTasks.length === 0) {
    taskList.innerHTML = '<p class="empty-text">No tasks for this date.</p>';
  } else {
    selectedDateTasks.forEach(task => {
      taskList.appendChild(createTaskCard(task, false));
    });
  }

  if (previousUnfinishedTasks.length === 0) {
    carryoverList.innerHTML = '<p class="empty-text">No unfinished jobs from previous days.</p>';
  } else {
    previousUnfinishedTasks
      .sort((a, b) => a.taskDate.localeCompare(b.taskDate))
      .forEach(task => {
        carryoverList.appendChild(createTaskCard(task, true));
      });
  }

  let doneCount = 0;
  let progressCount = 0;
  let revisionCount = 0;

  selectedDateTasks.forEach(task => {
    if (task.status === "Done") doneCount++;
    if (task.status === "In Progress") progressCount++;
    if (task.status === "Revision") revisionCount++;
  });

  totalTasks.textContent = selectedDateTasks.length;
  doneTasks.textContent = doneCount;
  progressTasks.textContent = progressCount;
  revisionTasks.textContent = revisionCount;
}

window.toggleDone = toggleDone;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.moveTaskToToday = moveTaskToToday;

renderTasks();