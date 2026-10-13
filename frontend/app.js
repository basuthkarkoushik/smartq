/* =====================================================
   SMARTQ - MAIN JAVASCRIPT (connected to the backend)
   ===================================================== */

// Works from http://localhost:3000 or from Live Server / file
const API_BASE = location.port === "3000" ? "" : "http://localhost:3000";


/* =====================================================
   API + DATA CACHE
   (pages still read data with getServices(), getAppointments()...
    the data now comes from the server)
   ===================================================== */

const cache = {
    services: [],
    appointments: [],
    currentToken: "Q000",
    customerCount: 0
};

async function api(url, method = "GET", body = null, silent = false) {

    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("smartq_token");

    if (token) headers.Authorization = "Bearer " + token;

    let res;

    try {
        res = await fetch(API_BASE + url, {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined
        });
    } catch (e) {
        if (!silent) {
            showMessage("Cannot reach server. Is the backend running?", "error");
        }
        throw e;
    }

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && token) {
        logout();
        throw new Error("Session expired");
    }

    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

async function refreshData(silent = false) {

    const data = await api("/api/state", "GET", null, silent);

    cache.services = data.services || [];
    cache.appointments = data.appointments || [];
    cache.currentToken = data.currentToken || "Q000";
    cache.customerCount = data.customerCount || 0;
}

function getServices() {
    return cache.services.slice();
}

function getAppointments() {
    return cache.appointments.slice();
}

function getCurrentUser() {

    if (!localStorage.getItem("smartq_token")) return null;

    return JSON.parse(localStorage.getItem("smartq_currentUser"));
}

function saveCurrentUser(user) {
    localStorage.setItem("smartq_currentUser", JSON.stringify(user));
}


/* =====================================================
   MESSAGE
   ===================================================== */

function showMessage(message, type = "success") {

    const old = document.querySelector(".notification");

    if (old) old.remove();

    const box = document.createElement("div");

    box.className = "notification";
    box.textContent = message;

    box.style.background =
        type === "error" ? "#c0392b" : "#238653";

    document.body.appendChild(box);

    setTimeout(() => {
        box.remove();
    }, 3000);
}


/* =====================================================
   AUTH
   ===================================================== */

async function login(email, password) {

    localStorage.removeItem("smartq_token");

    let data;

    try {
        data = await api("/api/login", "POST", { email, password });
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    localStorage.setItem("smartq_token", data.token);
    saveCurrentUser(data.user);

    if (data.user.role === "admin") {
        location.href = "admin.html";
    }
    else if (data.user.role === "staff") {
        location.href = "staff.html";
    }
    else {
        location.href = "dashboard.html";
    }
}


async function register(name, email, password, role = "customer", accessCode = "") {

    if (!name || !email || !password) {
        showMessage("Please fill all fields", "error");
        return;
    }

    if (role !== "customer" && !accessCode) {
        showMessage("Enter the " + role + " access code", "error");
        return;
    }

    try {
        await api("/api/register", "POST", { name, email, password, role, accessCode });
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage("Registration successful");

    document.getElementById("registerForm").reset();

    if (typeof toggleCode === "function") toggleCode();

    setTimeout(() => {
        document.getElementById("loginTab").click();
    }, 800);
}


let resetStage = 1;

async function handleForgot() {

    const email =
        document.getElementById("forgotEmail").value;

    if (resetStage === 1) {

        try {
            await api("/api/forgot-password", "POST", { email });
        } catch (e) {
            showMessage(e.message, "error");
            return;
        }

        resetStage = 2;

        document.getElementById("resetFields").classList.remove("hidden");
        document.getElementById("forgotEmail").readOnly = true;
        document.getElementById("forgotBtn").textContent = "Reset Password";
        document.getElementById("forgotHint").textContent =
            "If this email is registered, a 6-digit code has been generated. " +
            "It appears in the backend terminal window. Enter it below with a new password.";

        showMessage("Reset code generated");

        return;
    }

    const code =
        document.getElementById("resetCode").value;

    const password =
        document.getElementById("resetPassword").value;

    if (!code || !password) {
        showMessage("Enter the code and a new password", "error");
        return;
    }

    try {
        await api("/api/reset-password", "POST", { email, code, password });
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage("Password reset successful. Please login.");

    resetStage = 1;

    document.getElementById("forgotForm").reset();
    document.getElementById("resetFields").classList.add("hidden");
    document.getElementById("forgotEmail").readOnly = false;
    document.getElementById("forgotBtn").textContent = "Send Reset Code";
    document.getElementById("forgotHint").textContent =
        "Enter your registered email to get a reset code.";

    showLogin();
}


function logout() {

    localStorage.removeItem("smartq_currentUser");
    localStorage.removeItem("smartq_token");

    location.href = "index.html";
}


function requireUser(role = null) {

    const user = getCurrentUser();

    if (!user) {
        location.href = "index.html";
        return null;
    }

    if (role && user.role !== role) {

        if (user.role === "admin") {
            location.href = "admin.html";
        }
        else if (user.role === "staff") {
            location.href = "staff.html";
        }
        else {
            location.href = "dashboard.html";
        }

        return null;
    }

    return user;
}


/* =====================================================
   NAVBAR
   ===================================================== */

function createNavbar(active) {

    const user = getCurrentUser();

    const nav = document.getElementById("navbar");

    if (!nav || !user) return;

    let links = "";

    if (user.role === "customer") {

        links = `
            <a class="nav-link ${active === "dashboard" ? "active" : ""}"
               href="dashboard.html">Dashboard</a>

            <a class="nav-link ${active === "booking" ? "active" : ""}"
               href="booking.html">Book</a>

            <a class="nav-link ${active === "queue" ? "active" : ""}"
               href="queue.html">Queue</a>

            <a class="nav-link ${active === "history" ? "active" : ""}"
               href="history.html">History</a>

            <a class="nav-link ${active === "profile" ? "active" : ""}"
               href="profile.html">Profile</a>
        `;
    }

    nav.innerHTML = `
        <nav class="navbar">

            <div class="navbar-inner">

                <a href="${user.role === "customer" ? "dashboard.html" :
                           user.role === "staff" ? "staff.html" : "admin.html"}"
                   class="nav-logo">

                    <span class="nav-logo-mark">Q</span>
                    SmartQ

                </a>

                <div class="nav-links">
                    ${links}
                </div>

                <div class="nav-user">

                    <div class="avatar">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>

                    <button class="btn btn-secondary btn-small"
                            onclick="logout()">
                        Logout
                    </button>

                </div>

            </div>

        </nav>
    `;
}


/* =====================================================
   INDEX PAGE
   ===================================================== */

function setupAuth() {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const forgotForm = document.getElementById("forgotForm");

    if (loginForm) {

        loginForm.addEventListener("submit", function(e) {

            e.preventDefault();

            const email =
                document.getElementById("loginEmail").value;

            const password =
                document.getElementById("loginPassword").value;

            login(email, password);
        });
    }

    if (registerForm) {

        registerForm.addEventListener("submit", function(e) {

            e.preventDefault();

            const name =
                document.getElementById("registerName").value;

            const email =
                document.getElementById("registerEmail").value;

            const password =
                document.getElementById("registerPassword").value;

            const role =
                document.getElementById("registerRole").value;

            const accessCode =
                document.getElementById("registerCode").value;

            register(name, email, password, role, accessCode);
        });
    }

    if (forgotForm) {

        forgotForm.addEventListener("submit", function(e) {

            e.preventDefault();

            handleForgot();
        });
    }
}


/* =====================================================
   DASHBOARD
   ===================================================== */

function loadDashboard() {

    const user = requireUser("customer");

    if (!user) return;

    createNavbar("dashboard");

    const name = document.getElementById("userName");

    if (name) {
        name.textContent = user.name;
    }

    const appointments =
        getAppointments().filter(a => a.userId === user.id);

    const active =
        appointments.filter(
            a => a.status === "Waiting" || a.status === "Called"
        );

    const completed =
        appointments.filter(a => a.status === "Completed");

    document.getElementById("totalAppointments").textContent =
        appointments.length;

    document.getElementById("activeAppointments").textContent =
        active.length;

    document.getElementById("completedAppointments").textContent =
        completed.length;

    const services = getServices();

    const serviceBox =
        document.getElementById("services");

    serviceBox.innerHTML = services.map(service => `

        <div class="service-card">

            <div class="service-icon">Q</div>

            <div class="service-name">
                ${service.name}
            </div>

            <div class="service-info">
                ${service.description}
            </div>

            <div class="service-info">
                Duration: ${service.duration} minutes
            </div>

            <br>

            <a href="booking.html?service=${service.id}"
               class="btn btn-primary btn-small">
                Book Now
            </a>

        </div>

    `).join("");

    const recent =
        document.getElementById("recentAppointments");

    const latest =
        appointments.slice(-5).reverse();

    if (!latest.length) {

        recent.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">Q</div>

                <div class="empty-title">
                    No appointments yet
                </div>

                <p>
                    Book an appointment to get started.
                </p>

            </div>
        `;

    } else {

        recent.innerHTML =
            latest.map(appointmentHTML).join("");
    }
}


function appointmentHTML(a) {

    return `
        <div class="appointment-card">

            <div class="appointment-top">

                <div class="appointment-service">
                    ${a.serviceName}
                </div>

                <span class="badge ${badgeClass(a.status)}">
                    ${a.status}
                </span>

            </div>

            <div class="appointment-details">

                <div>
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${a.date}</div>
                </div>

                <div>
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${a.time}</div>
                </div>

                <div>
                    <div class="detail-label">Token</div>
                    <div class="detail-value">${a.token}</div>
                </div>

            </div>

        </div>
    `;
}


function badgeClass(status) {

    if (status === "Waiting") return "badge-waiting";

    if (status === "Called") return "badge-called";

    if (status === "Completed") return "badge-completed";

    return "badge-cancelled";
}


/* =====================================================
   BOOKING
   ===================================================== */

function loadBooking() {

    const user = requireUser("customer");

    if (!user) return;

    createNavbar("booking");

    const select =
        document.getElementById("service");

    const services = getServices();

    select.innerHTML = `
        <option value="">Select Service</option>

        ${services.map(s => `
            <option value="${s.id}" data-start="${s.startTime}" data-end="${s.endTime}">
                ${s.name} - ${s.duration} min (${s.startTime} - ${s.endTime})
            </option>
        `).join("")}
    `;

    const timeInput =
        document.getElementById("time");

    const timeHint =
        document.getElementById("timeHint");

    function updateTimeWindow() {

        const opt = select.selectedOptions[0];

        if (!opt || !opt.value) {
            timeInput.removeAttribute("min");
            timeInput.removeAttribute("max");
            if (timeHint) timeHint.textContent = "";
            return;
        }

        timeInput.min = opt.dataset.start;
        timeInput.max = opt.dataset.end;

        if (timeHint) {
            timeHint.textContent =
                "Available " + opt.dataset.start + " - " + opt.dataset.end;
        }
    }

    select.addEventListener("change", updateTimeWindow);

    const params =
        new URLSearchParams(location.search);

    const service =
        params.get("service");

    if (service) {
        select.value = service;
    }

    updateTimeWindow();

    const form =
        document.getElementById("bookingForm");

    form.addEventListener("submit", function(e) {

        e.preventDefault();

        createAppointment();
    });
}


async function createAppointment() {

    const user = requireUser("customer");

    if (!user) return;

    const serviceId =
        document.getElementById("service").value;

    const date =
        document.getElementById("date").value;

    const time =
        document.getElementById("time").value;

    if (!serviceId || !date || !time) {

        showMessage(
            "Please select service, date and time",
            "error"
        );

        return;
    }

    try {
        await api("/api/appointments", "POST", { serviceId, date, time });
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage(
        "Appointment booked successfully!"
    );

    setTimeout(() => {

        location.href = "queue.html";

    }, 900);
}


/* =====================================================
   QUEUE
   ===================================================== */

function loadQueue() {

    const user = requireUser("customer");

    if (!user) return;

    createNavbar("queue");

    const appointments =
        getAppointments();

    const active =
        appointments
        .filter(
            a =>
                a.userId === user.id &&
                (a.status === "Waiting" ||
                 a.status === "Called")
        )
        .pop();

    const box =
        document.getElementById("queueContent");

    if (!active) {

        box.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">Q</div>

                <div class="empty-title">
                    No active queue
                </div>

                <p>
                    You don't have an active appointment.
                </p>

                <br>

                <a href="booking.html"
                   class="btn btn-primary">
                    Book Appointment
                </a>

            </div>
        `;

        return;
    }

    const peopleAhead =
        active.peopleAhead || 0;

    const estimated =
        active.estimatedWait || 0;

    const current =
        getCurrentServing();

    box.innerHTML = `

        <div class="card queue-main">

            <div class="queue-label">
                CURRENTLY SERVING
            </div>

            <div class="current-token">
                ${current}
            </div>

            <hr>

            <div class="queue-label">
                YOUR TOKEN
            </div>

            <div class="your-token">
                ${active.token}
            </div>

            <span class="badge ${badgeClass(active.status)}">
                ${active.status}
            </span>

            <div class="queue-info-grid">

                <div class="queue-info">

                    <div class="queue-info-number">
                        ${peopleAhead}
                    </div>

                    <div class="queue-info-label">
                        People Ahead
                    </div>

                </div>

                <div class="queue-info">

                    <div class="queue-info-number">
                        ${estimated} min
                    </div>

                    <div class="queue-info-label">
                        Estimated Wait
                    </div>

                </div>

                <div class="queue-info">

                    <div class="queue-info-number">
                        ${active.time}
                    </div>

                    <div class="queue-info-label">
                        Appointment Time
                    </div>

                </div>

            </div>

            <br>

            <button class="btn btn-danger"
                    onclick="cancelAppointment('${active.id}')">
                Cancel Appointment
            </button>

        </div>
    `;
}


function getCurrentServing() {

    return cache.currentToken || "Q000";
}


async function cancelAppointment(id) {

    if (!confirm("Cancel this appointment?")) return;

    try {
        await api("/api/appointments/" + id + "/cancel", "PUT");
        await refreshData();
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage("Appointment cancelled");

    loadQueue();
}


/* =====================================================
   HISTORY
   ===================================================== */

function loadHistory() {

    const user = requireUser("customer");

    if (!user) return;

    createNavbar("history");

    displayHistory();

    const search =
        document.getElementById("historySearch");

    if (search) {

        search.addEventListener("input", displayHistory);
    }
}


function displayHistory() {

    const user = getCurrentUser();

    const search =
        document.getElementById("historySearch");

    const keyword =
        search ? search.value.toLowerCase() : "";

    const appointments =
        getAppointments()
        .filter(a => a.userId === user.id)
        .filter(
            a =>
                a.serviceName
                    .toLowerCase()
                    .includes(keyword) ||
                a.token
                    .toLowerCase()
                    .includes(keyword)
        )
        .reverse();

    const box =
        document.getElementById("historyList");

    if (!appointments.length) {

        box.innerHTML = `
            <div class="empty-state">
                <div class="empty-title">
                    No appointments found
                </div>
            </div>
        `;

        return;
    }

    box.innerHTML =
        appointments.map(appointmentHTML).join("");
}


/* =====================================================
   PROFILE
   ===================================================== */

function loadProfile() {

    const user = requireUser("customer");

    if (!user) return;

    createNavbar("profile");

    document.getElementById("profileName").textContent =
        user.name;

    document.getElementById("profileEmail").textContent =
        user.email;

    document.getElementById("nameInput").value =
        user.name;

    document.getElementById("emailInput").value =
        user.email;

    document
        .getElementById("profileForm")
        .addEventListener("submit", updateProfile);
}


async function updateProfile(e) {

    e.preventDefault();

    const name =
        document.getElementById("nameInput").value;

    const email =
        document.getElementById("emailInput").value;

    let data;

    try {
        data = await api("/api/profile", "PUT", { name, email });
    } catch (err) {
        showMessage(err.message, "error");
        return;
    }

    saveCurrentUser(data.user);

    document.getElementById("profileName").textContent =
        data.user.name;

    document.getElementById("profileEmail").textContent =
        data.user.email;

    showMessage("Profile updated successfully");
}


/* =====================================================
   STAFF
   ===================================================== */

function loadStaff() {

    const user = requireUser("staff");

    if (!user) return;

    createNavbar();

    displayStaffQueue();

    const appointments =
        getAppointments();

    const waiting =
        appointments.filter(
            a => a.status === "Waiting"
        );

    document.getElementById("waitingCount").textContent =
        waiting.length;

    document.getElementById("currentToken").textContent =
        getCurrentServing();
}


function displayStaffQueue() {

    const box =
        document.getElementById("staffQueue");

    const appointments =
        getAppointments();

    const queue =
        appointments.filter(
            a =>
                a.status === "Waiting" ||
                a.status === "Called"
        );

    if (!queue.length) {

        box.innerHTML = `
            <div class="empty-state">
                No customers in queue.
            </div>
        `;

        return;
    }

    box.innerHTML =
        queue.map(a => `

            <div class="queue-row">

                <div>

                    <div class="token-number">
                        ${a.token}
                    </div>

                    <div class="small muted">
                        ${a.userName}
                    </div>

                    <div class="small muted">
                        ${a.serviceName}
                    </div>

                </div>

                <div>

                    ${
                        a.status === "Waiting"

                        ?

                        `<button
                            class="btn btn-primary btn-small"
                            onclick="callCustomer('${a.id}')">
                            Call
                         </button>`

                        :

                        `<button
                            class="btn btn-success btn-small"
                            onclick="completeCustomer('${a.id}')">
                            Complete
                         </button>`
                    }

                    <button
                        class="btn btn-danger btn-small"
                        onclick="skipCustomer('${a.id}')">
                        Skip
                    </button>

                </div>

            </div>

        `).join("");
}


async function callCustomer(id) {

    const appointment =
        getAppointments().find(a => a.id === id);

    if (!appointment) return;

    try {
        await api("/api/appointments/" + id + "/call", "PUT");
        await refreshData();
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage(`${appointment.token} is now being called`);

    loadStaff();
}


async function completeCustomer(id) {

    try {
        await api("/api/appointments/" + id + "/complete", "PUT");
        await refreshData();
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage("Appointment completed");

    loadStaff();
}


async function skipCustomer(id) {

    try {
        await api("/api/appointments/" + id + "/cancel", "PUT");
        await refreshData();
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage("Customer skipped");

    loadStaff();
}


/* =====================================================
   ADMIN
   ===================================================== */

function loadAdmin() {

    const user = requireUser("admin");

    if (!user) return;

    createNavbar();

    updateAdminStats();

    displayAdminServices();

    displayAdminAppointments();
}


function updateAdminStats() {

    const appointments =
        getAppointments();

    document.getElementById("totalUsers").textContent =
        cache.customerCount;

    document.getElementById("totalServices").textContent =
        getServices().length;

    document.getElementById("totalAppointments").textContent =
        appointments.length;

    document.getElementById("waitingAppointments").textContent =
        appointments.filter(
            a => a.status === "Waiting"
        ).length;
}


function displayAdminServices() {

    const box =
        document.getElementById("adminServices");

    const services =
        getServices();

    box.innerHTML =
        services.map(service => `

            <div class="queue-row">

                <div>

                    <strong>
                        ${service.name}
                    </strong>

                    <div class="small muted">
                        ${service.duration} minutes &middot;
                        ${service.startTime} - ${service.endTime} &middot;
                        ${service.bookedToday || 0} / ${service.capacity} booked today
                    </div>

                </div>

                <button
                    class="btn btn-danger btn-small"
                    onclick="deleteService('${service.id}')">
                    Delete
                </button>

            </div>

        `).join("");
}


async function addService() {

    const name =
        document.getElementById("serviceName").value;

    const duration =
        document.getElementById("serviceDuration").value;

    const startTime =
        document.getElementById("serviceStart").value;

    const endTime =
        document.getElementById("serviceEnd").value;

    const capacity =
        document.getElementById("serviceCapacity").value;

    if (!name || !duration || !startTime || !endTime || !capacity) {

        showMessage(
            "Enter service name, duration, available time window and max appointments",
            "error"
        );

        return;
    }

    if (startTime >= endTime) {

        showMessage(
            "Start time must be earlier than end time",
            "error"
        );

        return;
    }

    try {
        await api("/api/services", "POST", { name, duration, startTime, endTime, capacity });
        await refreshData();
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    document.getElementById("serviceName").value = "";
    document.getElementById("serviceDuration").value = "";
    document.getElementById("serviceStart").value = "09:00";
    document.getElementById("serviceEnd").value = "18:00";
    document.getElementById("serviceCapacity").value = "";

    showMessage("Service added");

    loadAdmin();
}


async function deleteService(id) {

    if (!confirm("Delete this service?")) return;

    try {
        await api("/api/services/" + id, "DELETE");
        await refreshData();
    } catch (e) {
        showMessage(e.message, "error");
        return;
    }

    showMessage("Service deleted");

    loadAdmin();
}


function displayAdminAppointments() {

    const box =
        document.getElementById("adminAppointments");

    const appointments =
        getAppointments().reverse();

    if (!appointments.length) {

        box.innerHTML = `
            <div class="empty-state">
                No appointments.
            </div>
        `;

        return;
    }

    box.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>
                        <th>Token</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>

                </thead>

                <tbody>

                    ${appointments.map(a => `

                        <tr>

                            <td>
                                <strong>${a.token}</strong>
                            </td>

                            <td>${a.userName}</td>

                            <td>${a.serviceName}</td>

                            <td>${a.date}</td>

                            <td>${a.time}</td>

                            <td>
                                <span class="badge ${badgeClass(a.status)}">
                                    ${a.status}
                                </span>
                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}


/* =====================================================
   AUTO INITIALIZATION
   ===================================================== */

function startLiveUpdates(page) {

    let last = JSON.stringify(cache);

    setInterval(async () => {

        try {
            await refreshData(true);
        } catch (e) {
            return;
        }

        const now = JSON.stringify(cache);

        if (now === last) return;

        last = now;

        if (page === "queue") loadQueue();
        else loadStaff();

    }, 5000);
}


document.addEventListener("DOMContentLoaded", async function () {

    const page =
        document.body.dataset.page;

    if (page === "auth") {
        setupAuth();
        return;
    }

    try {
        if (getCurrentUser()) await refreshData();
    } catch (e) {
        return;
    }

    if (page === "dashboard") loadDashboard();

    if (page === "booking") loadBooking();

    if (page === "queue") loadQueue();

    if (page === "history") loadHistory();

    if (page === "profile") loadProfile();

    if (page === "staff") loadStaff();

    if (page === "admin") loadAdmin();

    if (page === "queue" || page === "staff") startLiveUpdates(page);
});