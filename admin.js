
import { supabase } from "./supabase.js";

// ==========================================
// READY PREPAREDNESS
// COMPLETE SUPABASE ADMIN DASHBOARD
// WITH PUSH NOTIFICATIONS
// ==========================================

const sections = {
    announcements: {
        title: "Disaster Announcements",
        singular: "Announcement",
        icon: "fa-bullhorn",
        table: "announcements",
        fields: [
            { name: "title", label: "Announcement Title", placeholder: "Enter announcement title" },
            {
                name: "category",
                label: "Category",
                type: "select",
                options: [
                    "Weather Alert",
                    "Disaster Warning",
                    "Emergency Notice",
                    "General Announcement"
                ]
            },
            { name: "date", label: "Date", type: "date" },
            { name: "message", label: "Announcement Message", type: "textarea" }
        ]
    },

    evacuation: {
        title: "Evacuation Centers",
        singular: "Evacuation Center",
        icon: "fa-location-dot",
        table: "evacuation_centers",
        fields: [
            { name: "name", label: "Center Name", placeholder: "Enter evacuation center name" },
            { name: "location", label: "Location", placeholder: "Enter place or address" },
            {
                name: "status",
                label: "Status",
                type: "select",
                options: ["Available", "Temporarily Closed"]
            }
        ]
    },

    hotlines: {
        title: "Emergency Hotlines",
        singular: "Emergency Service",
        icon: "fa-phone",
        table: "emergency_hotlines",
        fields: [
            { name: "name", label: "Service Name", placeholder: "Example: Police Station" },
            { name: "number", label: "Contact Number", type: "tel", placeholder: "Enter contact number" }
        ]
    },

    gobag: {
        title: "Go Bag Checklist",
        singular: "Go Bag Item",
        icon: "fa-suitcase",
        table: "go_bag_items",
        fields: [
            { name: "name", label: "Item Name", placeholder: "Enter item name" },
            { name: "image", label: "Picture Path", placeholder: "Example: images/extra-clothes.jpg" }
        ]
    },

    firstaid: {
        title: "First Aid Kit Checklist",
        singular: "First Aid Item",
        icon: "fa-kit-medical",
        table: "first_aid_items",
        fields: [
            { name: "name", label: "Item Name", placeholder: "Enter item name" },
            { name: "image", label: "Picture Path", placeholder: "Example: images/gauze.jpg" }
        ]
    },

    guide: {
        title: "Preparedness Guide",
        singular: "Guide",
        icon: "fa-book-open",
        table: "preparedness_guide",
        fields: [
            { name: "title", label: "Guide Title", placeholder: "Enter guide title" },
            { name: "instructions", label: "Instructions", type: "textarea" }
        ]
    },

    weather: {
        title: "Weather Reminders",
        singular: "Reminder",
        icon: "fa-cloud-sun",
        table: "weather_reminders",
        fields: [
            { name: "title", label: "Reminder Title", placeholder: "Enter reminder title" },
            { name: "message", label: "Reminder Message", type: "textarea" }
        ]
    }
};

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let currentSection = "dashboard";
let editingId = null;
let records = {};
let isReady = false;

const pageTitle = document.getElementById("pageTitle");
const modal = document.getElementById("recordModal");
const form = document.getElementById("recordForm");
const formFields = document.getElementById("formFields");
const toast = document.getElementById("toast");

const profileKey = "readyPreparednessAdminProfile";

// ==========================================
// DEFAULT RECORDS
// ==========================================

function getDefaultRecords() {
    return {
        gobag: [
            { name: "Extra Clothes", image: "images/extra-clothes.jpg" },
            { name: "Documents", image: "images/documents.jpg" },
            { name: "Drinking Water", image: "images/drinking-water.jpg" },
            { name: "Power Bank", image: "images/power-bank.jpg" },
            { name: "Radio", image: "images/radio.jpg" },
            { name: "Emergency Food", image: "images/emergency-food.jpg" },
            { name: "Whistle", image: "images/whistle.jpg" }
        ],

        firstaid: [
            { name: "Gauze", image: "images/gauze.jpg" },
            { name: "Scissors", image: "images/scissors.jpg" },
            { name: "Adhesive Bandages", image: "images/bandages.jpg" },
            { name: "Medicine", image: "images/medicine.jpg" },
            { name: "Thermometer", image: "images/thermometer.jpg" },
            { name: "Gloves", image: "images/gloves.jpg" },
            { name: "Cotton Balls", image: "images/cotton.jpg" },
            { name: "Betadine", image: "images/betadine.jpg" }
        ]
    };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function getSectionName(section) {
    return sections[section]?.singular || "Item";
}

// ==========================================
// AUTOMATIC HOTLINE ICONS
// ==========================================

function getHotlineIcon(name) {
    const service = String(name || "").toLowerCase();

    if (service.includes("police")) return "fa-shield-halved";
    if (service.includes("ambulance") || service.includes("medical")) return "fa-truck-medical";
    if (service.includes("fire")) return "fa-fire-extinguisher";
    if (service.includes("hospital") || service.includes("health")) return "fa-hospital";
    if (service.includes("rescue")) return "fa-life-ring";
    if (service.includes("disaster")) return "fa-house-crack";
    if (service.includes("barangay")) return "fa-building";

    return "fa-phone";
}

// ==========================================
// DATABASE CONVERSION
// ==========================================

function fromDatabase(section, row) {
    const item = { id: String(row.id) };

    switch (section) {
        case "announcements":
            Object.assign(item, {
                title: row.title || "",
                category: row.category || "",
                date: row.date || "",
                message: row.message || ""
            });
            break;

        case "evacuation":
            Object.assign(item, {
                name: row.name || "",
                location: row.location || "",
                status: row.status || "Available"
            });
            break;

        case "hotlines":
            Object.assign(item, {
                name: row.name || "",
                number: row.phone_number || ""
            });
            break;

        case "gobag":
        case "firstaid":
            Object.assign(item, {
                name: row.item_name || "",
                image: row.image_url || ""
            });
            break;

        case "guide":
            Object.assign(item, {
                title: row.title || "",
                instructions: row.instructions || ""
            });
            break;

        case "weather":
            Object.assign(item, {
                title: row.title || "",
                message: row.instructions || ""
            });
            break;
    }

    return item;
}

function toDatabase(section, item) {
    switch (section) {
        case "announcements":
            return {
                title: item.title,
                category: item.category,
                date: item.date || null,
                message: item.message
            };

        case "evacuation":
            return {
                name: item.name,
                location: item.location,
                status: item.status
            };

        case "hotlines":
            return {
                name: item.name,
                phone_number: item.number
            };

        case "gobag":
        case "firstaid":
            return {
                item_name: item.name,
                image_url: item.image || null
            };

        case "guide":
            return {
                title: item.title,
                instructions: item.instructions
            };

        case "weather":
            return {
                title: item.title,
                instructions: item.message
            };

        default:
            return {};
    }
}

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

async function checkAdminAccess() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        window.location.replace("admin-login.html");
        return false;
    }

    const user = data.session.user;

    const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError || !admin) {
        await supabase.auth.signOut();
        alert("This account is not authorized as an administrator.");
        window.location.replace("admin-login.html");
        return false;
    }

    return true;
}

// ==========================================
// LOAD DATA
// ==========================================

async function loadSection(section) {
    const config = sections[section];

    const { data, error } = await supabase
        .from(config.table)
        .select("*")
        .order("id", { ascending: true });

    if (error) throw error;

    records[section] = (data || []).map(row =>
        fromDatabase(section, row)
    );
}

async function seedDefaultItems() {
    const defaults = getDefaultRecords();

    for (const section of ["gobag", "firstaid"]) {
        const config = sections[section];

        const { count, error } = await supabase
            .from(config.table)
            .select("id", { count: "exact", head: true });

        if (error) throw error;

        if (count === 0) {
            const rows = defaults[section].map(item =>
                toDatabase(section, item)
            );

            const { error: insertError } = await supabase
                .from(config.table)
                .insert(rows);

            if (insertError) throw insertError;
        }
    }
}

// ==========================================
// ONE-TIME GO BAG AND FIRST AID SYNC
// ==========================================

async function syncChecklistItemsOnce() {
    const syncKey = "readyPreparednessChecklistFinalSynced";

    if (localStorage.getItem(syncKey) === "true") {
        return;
    }

    const defaults = getDefaultRecords();

    for (const section of ["gobag", "firstaid"]) {
        const config = sections[section];

        const { data: existingItems, error } = await supabase
            .from(config.table)
            .select("id")
            .order("id", { ascending: true });

        if (error) throw error;

        const existing = existingItems || [];
        const finalItems = defaults[section];

        for (let i = 0; i < finalItems.length; i++) {
            const item = finalItems[i];

            if (existing[i]) {
                const { error: updateError } = await supabase
                    .from(config.table)
                    .update({
                        item_name: item.name,
                        image_url: item.image
                    })
                    .eq("id", existing[i].id);

                if (updateError) throw updateError;

            } else {
                const { error: insertError } = await supabase
                    .from(config.table)
                    .insert({
                        item_name: item.name,
                        image_url: item.image
                    });

                if (insertError) throw insertError;
            }
        }

        const extraItems = existing.slice(finalItems.length);
        const extraIds = extraItems.map(item => item.id);

        if (extraIds.length > 0) {
            const { error: deleteError } = await supabase
                .from(config.table)
                .delete()
                .in("id", extraIds);

            if (deleteError) throw deleteError;
        }
    }

    localStorage.setItem(syncKey, "true");

    console.log("Go Bag and First Aid checklists updated successfully.");
}

async function loadAllRecords() {
    await seedDefaultItems();
    await syncChecklistItemsOnce();

    for (const section of Object.keys(sections)) {
        await loadSection(section);
    }

    isReady = true;

    updateStats();

    if (sections[currentSection]) {
        renderRecords(currentSection);
    }
}

// ==========================================
// NAVIGATION
// ==========================================

function showSection(section) {
    currentSection = section;

    document.querySelectorAll(".content-section").forEach(element => {
        element.classList.toggle("active", element.id === section);
    });

    document.querySelectorAll(".nav-link[data-section]").forEach(button => {
        button.classList.toggle("active", button.dataset.section === section);
    });

    const titles = {
        dashboard: "Dashboard Overview",
        settings: "Settings"
    };

    if (pageTitle) {
        pageTitle.textContent =
            titles[section] ||
            sections[section]?.title ||
            "Dashboard";
    }

    document.getElementById("sidebar")?.classList.remove("open");

    if (sections[section] && isReady) {
        renderRecords(section);
    }

    updateStats();
}

document.querySelectorAll(".nav-link[data-section]").forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.go);
    });
});

document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
});

// ==========================================
// MODAL
// ==========================================

function openModal(section, id = null) {
    if (!sections[section]) return;

    currentSection = section;
    editingId = id;

    const config = sections[section];

    const existing = id
        ? records[section].find(item => String(item.id) === String(id))
        : null;

    if (id && !existing) return;

    document.getElementById("modalTitle").textContent =
        (id ? "Edit " : "Add ") + config.singular;

    formFields.innerHTML = "";

    config.fields.forEach(field => {
        const wrapper = document.createElement("div");
        wrapper.className = "field";

        const label = document.createElement("label");
        label.textContent = field.label;
        wrapper.appendChild(label);

        let input;

        if (field.type === "textarea") {
            input = document.createElement("textarea");
            input.placeholder = field.placeholder || "";
        } else if (field.type === "select") {
            input = document.createElement("select");

            field.options.forEach(option => {
                const opt = document.createElement("option");
                opt.value = option;
                opt.textContent = option;
                input.appendChild(opt);
            });
        } else {
            input = document.createElement("input");
            input.type = field.type || "text";
            input.placeholder = field.placeholder || "";
        }

        input.name = field.name;
        input.required = true;
        input.value = existing?.[field.name] || "";

        wrapper.appendChild(input);

        if (field.name === "image") {
            const preview = document.createElement("img");

            preview.className = "image-preview";
            preview.alt = "Picture preview";
            preview.style.display = input.value ? "block" : "none";

            if (input.value) preview.src = input.value;

            input.addEventListener("input", () => {
                preview.src = input.value;
                preview.style.display = input.value ? "block" : "none";
            });

            preview.onerror = () => {
                preview.style.display = "none";
            };

            wrapper.appendChild(preview);
        }

        formFields.appendChild(wrapper);
    });

    modal.classList.add("show");
}

function closeModal() {
    modal?.classList.remove("show");
    form?.reset();

    if (formFields) formFields.innerHTML = "";

    editingId = null;
}

document.querySelectorAll(".add-btn").forEach(button => {
    button.addEventListener("click", () => {
        if (sections[currentSection]) {
            openModal(currentSection);
        }
    });
});

document.getElementById("closeModal")?.addEventListener("click", closeModal);
document.getElementById("cancelModal")?.addEventListener("click", closeModal);

modal?.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

// ==========================================
// SEND PUSH NOTIFICATION
// ==========================================

async function sendAnnouncementNotification(item, wasEditing) {
    const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
        throw new Error("Admin session not found.");
    }

    const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            title: wasEditing
                ? "Updated: " + item.title
                : "New Announcement: " + item.title,
            body: item.message,
            url: "/residents.html"
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || "Notification sending failed."
        );
    }

    return result.sent;
}

// ==========================================
// ADD AND UPDATE
// WITH PUSH NOTIFICATIONS
// ==========================================

form?.addEventListener("submit", async event => {
    event.preventDefault();

    const section = currentSection;
    const config = sections[section];

    if (!config) return;

    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    const wasEditing = editingId !== null;
    const recordId = editingId;

    let notificationSent = null;

    try {
        const item = {};

        config.fields.forEach(field => {
            item[field.name] = form.elements[field.name].value.trim();
        });

        const databaseData = toDatabase(section, item);

        let result;

        if (wasEditing) {
            result = await supabase
                .from(config.table)
                .update(databaseData)
                .eq("id", Number(recordId));
        } else {
            result = await supabase
                .from(config.table)
                .insert(databaseData);
        }

        if (result.error) throw result.error;

        // Send notification only for new or edited announcements.
        if (section === "announcements") {
            try {
                notificationSent = await sendAnnouncementNotification(
                    item,
                    wasEditing
                );

            } catch (notificationError) {
                console.error(
                    "Notification error:",
                    notificationError
                );

                notificationSent = false;
            }
        }

        await loadSection(section);

        closeModal();
        renderRecords(section);
        updateStats();

        if (section === "announcements") {
            if (notificationSent === false) {
                showToast(
                    "Announcement saved, but notification failed."
                );
            } else if (notificationSent === 0) {
                showToast(
                    "Announcement saved. No subscribed devices found."
                );
            } else {
                showToast(
                    wasEditing
                        ? "Announcement updated and notifications sent!"
                        : "Announcement added and notifications sent!"
                );
            }
        } else {
            showToast(
                wasEditing
                    ? "Changes updated successfully!"
                    : config.singular + " added successfully!"
            );
        }

    } catch (error) {
        console.error("Save error:", error);

        alert(
            "Unable to save your record.\n\n" + error.message
        );

    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

// ==========================================
// DISPLAY RECORDS
// ==========================================

function renderRecords(section) {
    const container = document.querySelector(`#${section} .record-list`);
    const count = document.querySelector(`#${section} .item-count`);

    if (!container || !count) return;

    const items = records[section] || [];

    count.textContent =
        items.length + (items.length === 1 ? " item" : " items");

    container.innerHTML = "";

    if (!items.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <p>No items yet. Click the Add button to get started.</p>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const name = item.title || item.name || "Untitled";

        const details = [
            item.category,
            item.number,
            item.location,
            item.date,
            item.status,
            item.instructions,
            item.message
        ].filter(Boolean);

        const row = document.createElement("div");
        row.className = "record-row";

        const info = document.createElement("div");
        info.className = "record-info";

        if (section === "hotlines") {
            const icon = document.createElement("div");
            icon.className = "stat-icon green";
            icon.innerHTML = `<i class="fa-solid ${getHotlineIcon(item.name)}"></i>`;
            info.appendChild(icon);

        } else if (item.image) {
            const img = document.createElement("img");
            img.src = item.image;
            img.alt = name;

            img.onerror = () => {
                img.style.display = "none";
            };

            info.appendChild(img);

        } else {
            const icon = document.createElement("div");
            icon.className = "stat-icon green";
            icon.innerHTML = `<i class="fa-solid ${sections[section].icon}"></i>`;
            info.appendChild(icon);
        }

        const textBox = document.createElement("div");
        textBox.className = "record-text";

        const heading = document.createElement("h4");
        heading.textContent = name;

        const sub = document.createElement("p");
        sub.textContent = details.join(" • ");

        textBox.append(heading, sub);
        info.appendChild(textBox);

        const actions = document.createElement("div");
        actions.className = "record-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "action-btn";
        edit.title = "Edit";
        edit.innerHTML = '<i class="fa-solid fa-pen"></i>';
        edit.addEventListener("click", () => openModal(section, item.id));

        const del = document.createElement("button");
        del.type = "button";
        del.className = "action-btn delete";
        del.title = "Delete";
        del.innerHTML = '<i class="fa-solid fa-trash"></i>';
        del.addEventListener("click", () => deleteRecord(section, item.id));

        actions.append(edit, del);
        row.append(info, actions);
        container.appendChild(row);
    });
}

// ==========================================
// DELETE
// ==========================================

async function deleteRecord(section, id) {
    const confirmed = confirm("Are you sure you want to delete this item?");

    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from(sections[section].table)
            .delete()
            .eq("id", Number(id));

        if (error) throw error;

        await loadSection(section);

        renderRecords(section);
        updateStats();

        showToast("Item deleted successfully!");

    } catch (error) {
        console.error("Delete error:", error);
        alert("Unable to delete this item.\n\n" + error.message);
    }
}

// ==========================================
// DASHBOARD COUNTERS
// ==========================================

function updateStats() {
    const set = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    set("statAnnouncements", records.announcements?.length || 0);
    set("statEvacuation", records.evacuation?.length || 0);
    set("statHotlines", records.hotlines?.length || 0);
    set("statGobag", records.gobag?.length || 0);
    set("statFirstaid", records.firstaid?.length || 0);
    set("statGuide", records.guide?.length || 0);
    set("statWeather", records.weather?.length || 0);
}

// ==========================================
// SETTINGS
// ==========================================

function initializeSettings() {
    const settingsSection = document.getElementById("settings");

    if (!settingsSection) return;

    let profile = {};

    try {
        profile = JSON.parse(localStorage.getItem(profileKey) || "{}");
    } catch {
        profile = {};
    }

    settingsSection.innerHTML = `
        <div class="section-intro">
            <div>
                <h1>Settings</h1>
                <p>Admin dashboard preferences.</p>
            </div>
        </div>

        <div class="panel settings-container">
            <h3><i class="fa-solid fa-user"></i> Admin Profile</h3>

            <div class="field">
                <label>Admin Name</label>
                <input type="text" id="adminName"
                    placeholder="Enter admin name"
                    value="${escapeHTML(profile.name || "")}">
            </div>

            <div class="field">
                <label>Admin Email</label>
                <input type="email" id="adminEmail"
                    placeholder="Enter admin email"
                    value="${escapeHTML(profile.email || "")}">
            </div>

            <button type="button" id="saveProfile" class="primary-btn">
                Save Profile
            </button>
        </div>

        <div class="panel settings-container">
            <h3><i class="fa-solid fa-database"></i> Data Backup</h3>
            <p>Download a copy of your dashboard records.</p>

            <button type="button" id="exportData" class="primary-btn">
                <i class="fa-solid fa-download"></i>
                Export Data
            </button>

            <div class="field">
                <label>Restore Backup</label>
                <input type="file" id="importData"
                    accept=".json,application/json">
            </div>
        </div>

        <div class="panel settings-container">
            <h3><i class="fa-solid fa-rotate"></i> Reset Default Items</h3>
            <p>Restore the original Go Bag and First Aid items.</p>

            <button type="button" id="resetData" class="delete">
                Reset Default Items
            </button>
        </div>

        <div class="panel settings-container">
            <h3><i class="fa-solid fa-circle-info"></i> About</h3>
            <p><strong>System:</strong> Ready Preparedness</p>
            <p><strong>Version:</strong> 1.0</p>
            <p>Community Disaster Preparedness Portal</p>
        </div>
    `;

    document.getElementById("saveProfile").addEventListener("click", () => {
        const name = document.getElementById("adminName").value.trim();
        const email = document.getElementById("adminEmail").value.trim();

        if (!name || !email) {
            showToast("Please complete your profile.");
            return;
        }

        localStorage.setItem(profileKey, JSON.stringify({ name, email }));
        showToast("Admin profile saved!");
    });

    document.getElementById("exportData").addEventListener("click", () => {
        const backup = {
            records,
            profile: JSON.parse(localStorage.getItem(profileKey) || "{}"),
            backupDate: new Date().toISOString()
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "ReadyPreparedness-Backup.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
        showToast("Backup downloaded!");
    });

    document.getElementById("importData").addEventListener("change", async event => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const backup = JSON.parse(await file.text());
            const imported = backup.records;

            if (
                !imported ||
                !Object.keys(sections).every(key => Array.isArray(imported[key]))
            ) {
                throw new Error("Invalid backup file.");
            }

            const confirmed = confirm(
                "Restore this backup? Your current online records will be replaced."
            );

            if (!confirmed) return;

            for (const section of Object.keys(sections)) {
                const config = sections[section];

                const { error: deleteError } = await supabase
                    .from(config.table)
                    .delete()
                    .not("id", "is", null);

                if (deleteError) throw deleteError;

                const rows = imported[section].map(item =>
                    toDatabase(section, item)
                );

                if (rows.length) {
                    const { error: insertError } = await supabase
                        .from(config.table)
                        .insert(rows);

                    if (insertError) throw insertError;
                }
            }

            if (backup.profile) {
                localStorage.setItem(profileKey, JSON.stringify(backup.profile));
            }

            await loadAllRecords();
            showToast("Backup restored successfully!");

        } catch (error) {
            console.error("Restore error:", error);
            alert("Unable to restore backup.\n\n" + error.message);

        } finally {
            event.target.value = "";
        }
    });

    document.getElementById("resetData").addEventListener("click", async () => {
        const confirmed = confirm(
            "This will reset Go Bag and First Aid items to their final default lists. Continue?"
        );

        if (!confirmed) return;

        try {
            for (const section of ["gobag", "firstaid"]) {
                const { error } = await supabase
                    .from(sections[section].table)
                    .delete()
                    .not("id", "is", null);

                if (error) throw error;
            }

            localStorage.removeItem("readyPreparednessChecklistFinalSynced");

            await seedDefaultItems();
            await syncChecklistItemsOnce();
            await loadAllRecords();

            showToast("Default items restored!");

        } catch (error) {
            console.error("Reset error:", error);
            alert("Unable to reset items.\n\n" + error.message);
        }
    });
}

// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logoutBtn")?.addEventListener("click", async event => {
    event.preventDefault();

    const confirmed = confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
        alert("Unable to log out: " + error.message);
        return;
    }

    window.location.replace("admin-login.html");
});

// ==========================================
// INITIALIZE
// ==========================================

async function startAdminDashboard() {
    try {
        const authorized = await checkAdminAccess();

        if (!authorized) return;

        initializeSettings();

        await loadAllRecords();

        showSection("dashboard");

    } catch (error) {
        console.error("Dashboard error:", error);
        alert("Unable to load dashboard data.\n\n" + error.message);
    }
}

startAdminDashboard();

// ==========================================
// END OF ADMIN JAVASCRIPT
// ==========================================
