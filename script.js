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
let allTasks = [];

addTaskBtn.addEventListener("click", handleSubmit);
filterDate.addEventListener("change", renderTasks);
cancelEditBtn.addEventListener("click", resetForm);

async function apiGet(action = "list") {
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`);
  return response.json();
}

async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
  return response.json();
}

async function loadTasks() {
  try {
    const data = await apiGet("list");
    if (!data.success) {
      alert(data.message || "Failed to load tasks.");
      return;
    }

    allTasks = data.tasks || [];
    renderTasks();
  } catch (error) {
    console.error(error);
    alert("Could not load tasks from Google Sheets.");
  }
}

async function handleSubmit() {
  if (editingTaskId) {
    await updateTask();
  } else {
    await addTask();
  }
}

function getFormTask() {
  return {
    id: editingTaskId,
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
}

function validateTask(task) {
  if (!task.projectName || !task.taskName || !task.taskDate) {
    alert("Please enter project name, task name, and date.");
    return false;
  }
  return true;
}

async function addTask() {
  const task = getFormTask();
  if (!validateTask(task)) return;

  try {
    const data = await apiPost({
      action: "create",
      task
    });

    if (!data.success) {
      alert(data.message || "Failed to add task.");
      return;
    }

    resetForm();
    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Could not save task to Google Sheets.");
  }
}

async function updateTask() {
  const task = getFormTask();
  if (!validateTask(task)) return;

  try {
    const data = await apiPost({
      action: "update",
      task
    });

    if (!data.success) {
      alert(data.message || "Failed to update task.");
      return;
    }

    resetForm();
    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Could not update task.");
  }
}

function editTask(id) {
  const task = allTasks.find(t => String(t.id) === String(id));
  if (!task) return;

  editingTaskId = task.id;

  projectName.value = task.projectName || "";
  taskName.value = task.taskName || "";
  taskDate.value = task.taskDate || today;
  deadline.value = task.deadline || "";
  status.value = task.status || "To Do";
  priority.value = task.priority || "Low";
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

async function deleteTask(id) {
  try {
    const data = await apiPost({
      action: "delete",
      id
    });

    if (!data.success) {
      alert(data.message || "Failed to delete task.");
      return;
    }

    if (editingTaskId === id) {
      resetForm();
    }

    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Could not delete task.");
  }
}

async function toggleDone(id) {
  try {
    const data = await apiPost({
      action: "toggleDone",
      id
    });

    if (!data.success) {
      alert(data.message || "Failed to change status.");
      return;
    }

    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Could not update task status.");
  }
}

async function moveTaskToToday(id) {
  try {
    const data = await apiPost({
      action: "moveToToday",
      id
    });

    if (!data.success) {
      alert(data.message || "Failed to move task.");
      return;
    }

    filterDate.value = today;
    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Could not move task to today.");
  }
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
  card.className = `task-card ${(task.priority || "low").toLowerCase()}`;

  card.innerHTML = `
    <div class="task-top">
      <div>
        <div class="task-title ${task.status === "Done" ? "done-text" : ""}">
          ${escapeHtml(task.taskName || "")}
        </div>
        <div class="task-project">Project: ${escapeHtml(task.projectName || "")}</div>
      </div>
      <div><strong>${escapeHtml(task.status || "")}</strong></div>
    </div>

    <div class="task-meta">
      <div><strong>Date:</strong> ${escapeHtml(task.taskDate || "")}</div>
      <div><strong>Deadline:</strong> ${task.deadline ? escapeHtml(task.deadline) : "-"}</div>
      <div><strong>Priority:</strong> ${escapeHtml(task.priority || "")}</div>
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
      <button class="small-btn" onclick="toggleDone('${task.id}')">
        ${task.status === "Done" ? "Mark To Do" : "Mark Done"}
      </button>
      <button class="small-btn edit-btn" onclick="editTask('${task.id}')">
        Edit
      </button>
      ${isCarryover ? `
        <button class="small-btn" onclick="moveTaskToToday('${task.id}')">
          Move Task to Today
        </button>
      ` : ""}
      <button class="small-btn delete-btn" onclick="deleteTask('${task.id}')">
        Delete
      </button>
    </div>
  `;

  return card;
}

function renderTasks() {
  const selectedDate = filterDate.value;

  const selectedDateTasks = allTasks.filter(task => task.taskDate === selectedDate);

  const previousUnfinishedTasks = allTasks.filter(task =>
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

loadTasks();