
import { supabase } from "./supabase.js";
import { VAPID_PUBLIC_KEY } from "./push-config.js";

// =====================================
// READY PREPAREDNESS - RESIDENTS
// =====================================


// =====================================
// PAGE NAVIGATION
// =====================================

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");
const menuIcon = document.querySelector(".menu-icon");

const moreToggle = document.getElementById("moreToggle");
const moreMenu = document.getElementById("moreMenu");

const pageSections = document.querySelectorAll("[data-page-section]");
const bottomNavLinks = document.querySelectorAll(
    ".bottom-navigation a[href^='#']"
);

function closeNavigation() {
    navigation?.classList.remove("active");
    menuToggle?.classList.remove("active");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation menu");
    navigation?.setAttribute("aria-hidden", "true");

    if (menuIcon) menuIcon.textContent = "☰";
}

function closeMoreMenu() {
    moreMenu?.classList.remove("active");
    moreToggle?.setAttribute("aria-expanded", "false");
    moreMenu?.setAttribute("aria-hidden", "true");
}

function showSection(sectionId, shouldScroll = true) {
    const targetSection = document.querySelector(
        `[data-page-section="${sectionId}"]`
    );

    if (!targetSection) {
        console.warn("Page section not found:", sectionId);
        return;
    }

    pageSections.forEach(section => {
        section.hidden = section.dataset.pageSection !== sectionId;
    });

    bottomNavLinks.forEach(link => {
        const linkSection = link.getAttribute("href").substring(1);
        link.classList.toggle("active", linkSection === sectionId);
    });

    closeNavigation();
    closeMoreMenu();

    if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (window.location.hash !== `#${sectionId}`) {
        history.replaceState(null, "", `#${sectionId}`);
    }
}

showSection("home", false);


// =====================================
// HEADER MENU
// =====================================

menuToggle?.addEventListener("click", () => {
    const isOpen = navigation?.classList.toggle("active");

    menuToggle.classList.toggle("active", Boolean(isOpen));
    menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
    );

    navigation?.setAttribute("aria-hidden", String(!isOpen));

    if (menuIcon) menuIcon.textContent = isOpen ? "✕" : "☰";

    if (isOpen) {
        closeMoreMenu();
    }
});


// =====================================
// MORE MENU
// =====================================

moreToggle?.addEventListener("click", () => {
    const isOpen = moreMenu?.classList.toggle("active");

    moreToggle?.setAttribute("aria-expanded", String(Boolean(isOpen)));
    moreMenu?.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
        closeNavigation();
    }
});


// =====================================
// PAGE LINKS
// =====================================

document.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const sectionId = link.getAttribute("href").substring(1);

    const targetSection = document.querySelector(
        `[data-page-section="${sectionId}"]`
    );

    if (!targetSection) return;

    event.preventDefault();
    showSection(sectionId);
});


// =====================================
// CLOSE MENUS OUTSIDE
// =====================================

document.addEventListener("click", event => {
    if (
        navigation &&
        menuToggle &&
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {
        closeNavigation();
    }

    if (
        moreMenu &&
        moreToggle &&
        !moreMenu.contains(event.target) &&
        !moreToggle.contains(event.target)
    ) {
        closeMoreMenu();
    }
});


// =====================================
// ESCAPE KEY
// =====================================

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeNavigation();
        closeMoreMenu();
    }
});


// =====================================
// HTML ESCAPE
// =====================================

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


// =====================================
// DATE FORMAT
// =====================================

function formatDate(value) {
    if (!value) return "Date not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}


// =====================================
// SHOW MESSAGE
// =====================================

function showMessage(elementId, message, className = "empty-message") {
    const element = document.getElementById(elementId);

    if (element) {
        element.innerHTML = `
            <p class="${className}">
                ${escapeHTML(message)}
            </p>
        `;
    }
}


// =====================================
// LOAD DATA FROM SUPABASE
// =====================================

async function loadTable(tableName, elementId, renderFunction) {
    const element = document.getElementById(elementId);
    if (!element) return [];

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select("*");

        if (error) throw error;

        if (!data || data.length === 0) {
            showMessage(elementId, "No information available yet.");
            return [];
        }

        element.innerHTML = data
            .map((item, index) => renderFunction(item, index))
            .join("");

        return data;

    } catch (error) {
        console.error(`Error loading ${tableName}:`, error);

        showMessage(
            elementId,
            "Unable to load information. Please try again.",
            "error-message"
        );

        return [];
    }
}


// =====================================
// ANNOUNCEMENTS
// =====================================

function renderAnnouncement(item) {
    const title = escapeHTML(item.title || "Untitled Announcement");
    const message = escapeHTML(item.message || "");
    const category = escapeHTML(item.category || "General");
    const date = formatDate(item.date || item.created_at);

    return `
        <article class="announcement-card">
            <div class="announcement-meta">
                <span class="category-tag">${category}</span>
                <span>${date}</span>
            </div>
            <h3>${title}</h3>
            <p>${message}</p>
        </article>
    `;
}


// =====================================
// EVACUATION CENTERS
// =====================================

function renderEvacuation(item) {
    const name = escapeHTML(item.name || "Evacuation Center");
    const location = escapeHTML(item.location || "Location not specified");
    const status = escapeHTML(item.status || "Available");

    return `
        <article class="content-card">
            <div class="card-icon">🏫</div>
            <h3>${name}</h3>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Status:</strong> ${status}</p>
        </article>
    `;
}


// =====================================
// AUTOMATIC HOTLINE ICONS
// =====================================

function getHotlineIcon(name) {
    const service = String(name || "").toLowerCase();

    if (service.includes("police")) return "fa-shield-halved";

    if (
        service.includes("ambulance") ||
        service.includes("medical")
    ) return "fa-truck-medical";

    if (service.includes("fire")) return "fa-fire-extinguisher";

    if (
        service.includes("hospital") ||
        service.includes("health")
    ) return "fa-hospital";

    if (service.includes("rescue")) return "fa-life-ring";

    if (service.includes("disaster")) return "fa-house-crack";

    if (service.includes("barangay")) return "fa-building";

    return "fa-phone";
}


// =====================================
// EMERGENCY HOTLINES
// =====================================

function renderHotline(item) {
    const name = escapeHTML(item.name || "Emergency Service");
    const phone = String(item.phone_number || "");
    const safePhone = escapeHTML(phone);

    const phoneForLink = phone.replace(/[^\d+]/g, "");
    const icon = getHotlineIcon(item.name);

    const callButton = phoneForLink
        ? `
            <a class="phone-link"
               href="tel:${escapeHTML(phoneForLink)}">
                <i class="fa-solid fa-phone"></i>
                Call Now
            </a>
        `
        : `<p>Contact number not available.</p>`;

    return `
        <article class="content-card hotline-card">

            <div class="hotline-icon">
                <i class="fa-solid ${icon}"></i>
            </div>

            <h3>${name}</h3>

            <p class="hotline-number">
                ${safePhone || "No number available"}
            </p>

            ${callButton}

        </article>
    `;
}


// =====================================
// GO BAG AND FIRST AID CHECKLIST
// =====================================

function renderChecklistItem(item, index, type) {
    const name = escapeHTML(item.item_name || "Checklist Item");

    const image = item.image_url
        ? `
            <div class="checklist-image">
                <img
                    src="${escapeHTML(item.image_url)}"
                    alt=""
                    loading="lazy"
                >
            </div>
        `
        : `
            <div class="checklist-image checklist-image-empty">
                <i class="fa-solid fa-image"></i>
            </div>
        `;

    return `
        <article class="content-card checklist-card">

            <input
                type="checkbox"
                id="${type}-${index}"
                aria-label="Mark ${name} as prepared"
            >

            ${image}

            <h3 class="checklist-item-name">${name}</h3>

        </article>
    `;
}

function renderGoBag(item, index) {
    return renderChecklistItem(item, index, "gobag");
}

function renderFirstAid(item, index) {
    return renderChecklistItem(item, index, "firstaid");
}


// =====================================
// CHECKBOX APPEARANCE
// =====================================

document.addEventListener("change", event => {
    if (
        event.target.matches(
            ".checklist-card input[type='checkbox']"
        )
    ) {
        const card = event.target.closest(".checklist-card");

        if (card) {
            card.classList.toggle(
                "is-checked",
                event.target.checked
            );
        }
    }
});


// =====================================
// PREPAREDNESS GUIDE
// =====================================

function renderGuide(item) {
    const title = escapeHTML(item.title || "Preparedness Guide");
    const instructions = escapeHTML(item.instructions || "");

    return `
        <article class="guide-card">
            <h3>📘 ${title}</h3>
            <p>${instructions}</p>
        </article>
    `;
}


// =====================================
// WEATHER REMINDERS
// =====================================

function renderWeather(item) {
    const title = escapeHTML(item.title || "Weather Reminder");
    const instructions = escapeHTML(item.instructions || "");

    return `
        <article class="guide-card">
            <h3>🌦️ ${title}</h3>
            <p>${instructions}</p>
        </article>
    `;
}


// =====================================
// LOAD ALL RESIDENT INFORMATION
// =====================================

async function loadResidentsPage() {
    const announcements = await loadTable(
        "announcements",
        "announcementList",
        renderAnnouncement
    );

    const evacuation = await loadTable(
        "evacuation_centers",
        "evacuationList",
        renderEvacuation
    );

    const hotlines = await loadTable(
        "emergency_hotlines",
        "hotlineList",
        renderHotline
    );

    const goBag = await loadTable(
        "go_bag_items",
        "goBagList",
        renderGoBag
    );

    const firstAid = await loadTable(
        "first_aid_items",
        "firstAidList",
        renderFirstAid
    );

    const guides = await loadTable(
        "preparedness_guide",
        "guideList",
        renderGuide
    );

    const weather = await loadTable(
        "weather_reminders",
        "weatherList",
        renderWeather
    );

    console.log("Residents page loaded successfully.");

    console.log({
        announcements: announcements.length,
        evacuationCenters: evacuation.length,
        hotlines: hotlines.length,
        goBagItems: goBag.length,
        firstAidItems: firstAid.length,
        guides: guides.length,
        weatherReminders: weather.length
    });
}


// =====================================
// PUSH NOTIFICATION SUBSCRIPTION
// INSERT ONLY - NO PUBLIC SELECT/UPDATE
// =====================================

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);

    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(char => char.charCodeAt(0))
    );
}

async function enablePushNotifications() {
    const button = document.getElementById("enableNotifications");
    const status = document.getElementById("notificationStatus");

    if (!button || !status) return;

    try {
        if (
            !("serviceWorker" in navigator) ||
            !("PushManager" in window) ||
            !("Notification" in window)
        ) {
            throw new Error(
                "Your browser does not support push notifications."
            );
        }

        if (!VAPID_PUBLIC_KEY) {
            throw new Error("VAPID Public Key is missing.");
        }

        button.disabled = true;
        status.textContent = "Setting up notifications...";

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            throw new Error(
                "Notification permission was not granted."
            );
        }

        const registration = await navigator.serviceWorker.ready;

        let subscription =
            await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey:
                    urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        const subscriptionData = subscription.toJSON();

        const endpoint = subscriptionData.endpoint;
        const p256dh = subscriptionData.keys?.p256dh;
        const auth = subscriptionData.keys?.auth;

        if (!endpoint || !p256dh || !auth) {
            throw new Error(
                "Unable to retrieve notification subscription details."
            );
        }

        // Save using INSERT only.
        const { error } = await supabase
            .from("push_subscriptions")
            .insert({
                endpoint,
                p256dh,
                auth
            });

        if (error) {
            if (error.code === "23505") {
                status.textContent =
                    "This device is already registered for notifications.";

                button.innerHTML =
                    '<i class="fa-solid fa-check"></i> Notifications Enabled';

                return;
            }

            throw error;
        }

        status.textContent =
            "Notifications successfully enabled!";

        button.innerHTML =
            '<i class="fa-solid fa-check"></i> Notifications Enabled';

    } catch (error) {
        console.error("Notification subscription error:", error);

        status.textContent =
            error.message || "Unable to enable notifications.";

    } finally {
        button.disabled = false;
    }
}

document
    .getElementById("enableNotifications")
    ?.addEventListener("click", enablePushNotifications);


// =====================================
// START
// =====================================

loadResidentsPage();
