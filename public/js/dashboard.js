const token = localStorage.getItem("admin_token");
const currentUser = JSON.parse(localStorage.getItem("admin_user") || "null");

if (!token || !currentUser) {
  window.location.href = "login.html";
}

const whoAmI = document.getElementById("who-am-i");
const tableBody = document.getElementById("staff-table-body");
const emptyState = document.getElementById("empty-state");
const addStaffBtn = document.getElementById("add-staff-btn");
const toast = document.getElementById("toast");

const modalOverlay = document.getElementById("staff-modal-overlay");
const modalTitle = document.getElementById("staff-modal-title");
const staffForm = document.getElementById("staff-form");
const staffIdField = document.getElementById("staff-id");
const staffNameField = document.getElementById("staff-name");
const staffEmailField = document.getElementById("staff-email");
const staffPasswordField = document.getElementById("staff-password");
const staffRoleField = document.getElementById("staff-role");
const staffStatusField = document.getElementById("staff-status");

whoAmI.textContent = `${currentUser.name} (${currentUser.role})`;

// Non-admins can't add or edit staff — hide those controls
const isAdmin = currentUser.role === "admin";
if (!isAdmin) addStaffBtn.style.display = "none";

// ---------- API helper ----------
async function api(path, options = {}) {
  const res = await fetch(`/api/staff${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "login.html";
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString();
}

// ---------- Render staff table ----------
async function loadStaff() {
  try {
    const { staff } = await api("/");
    renderTable(staff);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderTable(staff) {
  tableBody.innerHTML = "";

  if (!staff.length) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  staff.forEach((u) => {
    const tr = document.createElement("tr");

    const canManage = isAdmin && u.id !== currentUser.id;

    tr.innerHTML = `
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge ${u.role}">${u.role}</span></td>
      <td><span class="badge ${u.status}">${u.status}</span></td>
      <td>${formatDate(u.lastLogin)}</td>
      <td class="row-actions">
        ${
          isAdmin
            ? `<button data-action="edit" data-id="${u.id}">Edit</button>
               ${canManage ? `<button data-action="delete" data-id="${u.id}" class="danger">Delete</button>` : ""}`
            : ""
        }
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modal open/close ----------
function openModal(mode, user = null) {
  staffForm.reset();
  staffPasswordField.placeholder = mode === "add"
    ? "Set a password"
    : "Leave blank to keep current password";
  staffPasswordField.required = mode === "add";

  if (mode === "add") {
    modalTitle.textContent = "Add Staff";
    staffIdField.value = "";
  } else {
    modalTitle.textContent = "Edit Staff";
    staffIdField.value = user.id;
    staffNameField.value = user.name;
    staffEmailField.value = user.email;
    staffRoleField.value = user.role;
    staffStatusField.value = user.status;
  }

  modalOverlay.classList.add("open");
}

function closeModal() {
  modalOverlay.classList.remove("open");
}

addStaffBtn.addEventListener("click", () => openModal("add"));
document.getElementById("staff-modal-cancel").addEventListener("click", closeModal);

// ---------- Table row actions ----------
tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") {
    try {
      const { staff } = await api("/");
      const user = staff.find((u) => u.id === id);
      if (user) openModal("edit", user);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (action === "delete") {
    if (!confirm("Delete this staff account? This cannot be undone.")) return;
    try {
      await api(`/${id}`, { method: "DELETE" });
      showToast("Staff account deleted.");
      loadStaff();
    } catch (err) {
      showToast(err.message, "error");
    }
  }
});

// ---------- Form submit (create or update) ----------
staffForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = staffIdField.value;
  const name = staffNameField.value.trim();
  const email = staffEmailField.value.trim();
  const password = staffPasswordField.value;
  const role = staffRoleField.value;
  const status = staffStatusField.value;

  try {
    if (id) {
      // Update basic info
      await api(`/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, email, status }),
      });
      // Update role if changed
      await api(`/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      // Update password only if a new one was entered
      if (password) {
        await api(`/${id}/password`, {
          method: "PUT",
          body: JSON.stringify({ password }),
        });
      }
      showToast("Staff account updated.");
    } else {
      await api("/", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      showToast("Staff account created.");
    }

    closeModal();
    loadStaff();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ---------- Logout ----------
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

// ---------- Init ----------
loadStaff();
