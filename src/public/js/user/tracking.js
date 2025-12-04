// this is the file that collects user beheviour data from frontend , 
// uses getLog to send data to backend Kafka producer
console.log('start load file')

function generateSessionId() {
  return `${getVietnamTimestamp()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSessionId() {
  let id = sessionStorage.getItem("SESSION_ID");
  if (!id) {
    id = generateSessionId();
    sessionStorage.setItem("SESSION_ID", id);
  }
  return id;
}

function getAnonymousId() {
  let id = localStorage.getItem("anonId");
  if (!id) {
    id = "anon-" + getVietnamTimestamp() + "-" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("anonId", id);
  }
  return id;
}

// initial session (sessionStorage so same tab/window preserves session across history navigation)
let SESSION_ID = getOrCreateSessionId();
const USER_ID = window.uid || getAnonymousId();

let lastActivityTime = getVietnamTimestamp();
let isIdle = false;
let sessionExpired = false;
let sessionStarted = false;
let sessionEnded = false;
let isNavigating = false; // set true for internal navigations (link clicks)
let isReload = false;     // set true when we detect reload (handled on load)
let sessionKilled = false;

const IDLE_LIMIT = 5 * 60 * 1000;
const IDLE_SESSION_TIMEOUT = 15 * 60 * 1000;
const HIDDEN_TAB_TIMEOUT = 10 * 60 * 1000;

let isPageVisible = true;
const HEARTBEAT_INTERVAL = 6767;

let idleExitTimeout = null;
let hiddenTabTimeout = null;

// ===============================================
// TIMEZONE: GMT+7 Vietnam
// ===============================================
function getVietnamTimestamp() {
  const now = Date.now();
  const vietnamOffset = 7 * 60 * 60 * 1000; // GMT+7 in milliseconds
  return now + vietnamOffset;
}

// ===============================================
// UTIL: Send to backend → Kafka
// ===============================================
async function getLogForTrackingOnly(topic, value) {
  try {
    await fetch("/data/streamingKafka", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, value })
    });
  } catch (err) {
    console.warn("Failed to send log:", err);
  }
}

async function sendEvent(event) {
  // suppress old-session events
  if (sessionKilled && event.type !== "page_view" && event.type !== "page_exit") return;

  if (!isPageVisible && event.type !== "heartbeat" && event.type !== "idle" && event.type !== "page_exit") return;

  try {
    await getLogForTrackingOnly("web-events", event);
  } catch (err) {
    console.warn("Tracking failed:", err);
  }
}

// ===============================================
// EVENT BUILDERS
// ===============================================
function eventBase(type) {
  return {
    type,
    sessionId: SESSION_ID,
    userId: USER_ID,
    timestamp: getVietnamTimestamp(),
    url: window.location.pathname
  };
}

const pageViewEvent = () => eventBase("page_view");
const pageExitEvent = () => eventBase("page_exit");
const visibilityEvent = (state) => ({ ...eventBase("visibility_change"), state });

function activityEvent(action) {
  lastActivityTime = getVietnamTimestamp();

  if (hiddenTabTimeout) {
    clearTimeout(hiddenTabTimeout);
    hiddenTabTimeout = null;
  }

  if (isIdle) {
    isIdle = false;
    clearTimeout(idleExitTimeout);
    idleExitTimeout = null;
  }

  return { ...eventBase("activity"), action };
}

const idleEvent = () => eventBase("idle");
const heartbeatEvent = () => eventBase("heartbeat");

// ===============================================
// THROTTLE
// ===============================================
function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = getVietnamTimestamp();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

const throttledMouseMove = throttle(() => sendEvent(activityEvent("mousemove")), 5000);
const throttledScroll = throttle(() => sendEvent(activityEvent("scroll")), 1000);
const throttledKeydown = throttle(() => sendEvent(activityEvent("keydown")), 5000);
const throttledClick = throttle(() => sendEvent(activityEvent("click")), 120);

// ===============================================
// NAVIGATION DETECTION (new/critical)
// ===============================================

// 1) detect internal link clicks early -> mark isNavigating so pagehide won't treat as exit
document.addEventListener("click", (e) => {
  const link = e.target.closest && e.target.closest("a");
  if (link && link.href && !link.target) {
    try {
      const linkUrl = new URL(link.href);
      const currentUrl = new URL(window.location.href);
      if (linkUrl.hostname === currentUrl.hostname) {
        isNavigating = true;
        // console.log("Internal link click -> isNavigating true");
      }
    } catch (err) {
      // ignore
    }
  }
}, true);

// 2) detect SPA/history navigations where possible (popstate fired in the page that becomes active)
window.addEventListener("popstate", (e) => {
  // Popstate often indicates back/forward navigation.
  // We set isNavigating true on the outgoing page in some browsers via pagehide/persisted handling.
  // This handler helps when SPA state changes use history.pushState/popstate patterns.
  isNavigating = true;
  // console.log("popstate -> isNavigating true");
});

// ===============================================
// PAGEHIDE / PAGESHOW handling (BFCache-aware)
// ===============================================

// IMPORTANT: use pagehide rather than beforeunload. pagehide fires reliably and
// includes event.persisted to detect BFCache (back/forward cache).
window.addEventListener("pagehide", (event) => {
  // If event.persisted === true => page will be stored in BFCache (back/forward)
  // Do NOT send page_exit in that case (we will resume the same session on pageshow)
  if (event.persisted) {
    // BFCache save - keep session alive, mark as navigation
    // console.log("pagehide: persisted (BFCache) -> preserve session");
    isNavigating = true;
    return;
  }

  // Not persisted -> page is unloading permanently (could be reload, tab close, cross-site nav)
  // If this unload is due to an internal navigation (isNavigating true), we should preserve session.
  // Otherwise (no isNavigating) this is a reload or tab close or external navigation.
  if (!isNavigating) {
    // This is a potential tab close or reload or external navigation.
    // We will treat it as session end here (send page_exit) — but note:
    // - For reload we want a new session on next load; sending page_exit here is correct.
    // - For tab close this is correct as well.
    // - For external navigation (leaving site) this is correct too.
    sessionEnded = true;
    sessionExpired = true;
    sessionKilled = true;

    clearTimeout(idleExitTimeout);
    clearTimeout(hiddenTabTimeout);

    // send page_exit now (best-effort)
    sendEvent(pageExitEvent());
    // console.log("pagehide: not navigating -> sent page_exit and removed session");

    // remove session id; on reload we'll create a new one in load handler
    try {
      sessionStorage.removeItem("SESSION_ID");
    } catch (err) {}
  } else {
    // pagehide during navigation -> preserve session
    // console.log("pagehide: during navigation -> preserve session");
  }

  // reset navigation flag for safety; it will be set again by click/popstate if needed
  isNavigating = false;
});

// pageshow fires when the page is shown (load or BFCache restore)
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // BFCache restore - the page was restored from memory; JS state is already preserved.
    // We must ensure the session flags do not treat the session as ended.
    sessionKilled = false;
    sessionEnded = false;
    sessionExpired = false;
    isPageVisible = true;
    // resume activity
    sendEvent(visibilityEvent("visible"));
    // console.log("pageshow: BFCache restore -> revived session");
    return;
  }
  // If pageshow is not persisted, this is a normal load; reload detection is handled in load event
});

// ===============================================
// LOAD event: handle reload detection and session initialization
// ===============================================
window.addEventListener("load", () => {
  // Performance navigation type detection (modern browsers)
  // Note: This info is valid only on load.
  let navType = null;
  try {
    const navEntries = performance.getEntriesByType && performance.getEntriesByType("navigation");
    if (navEntries && navEntries.length) {
      navType = navEntries[0].type; // "navigate", "reload", "back_forward", etc.
    } else if (performance.navigation) {
      // fallback (deprecated API)
      navType = (performance.navigation.type === 1) ? "reload" : "navigate";
    }
  } catch (err) {
    // ignore
  }

  if (navType === "reload") {
    // Reload -> we intentionally create a new session (per your requirement).
    // Note: pagehide (above) has already sent page_exit for non-navigations; if browser didn't call pagehide
    // we still want to ensure session id is reset now.
    try {
      sessionStorage.removeItem("SESSION_ID");
    } catch (err) {}
    SESSION_ID = generateSessionId();
    sessionStorage.setItem("SESSION_ID", SESSION_ID);

    sessionStarted = false;
    sessionEnded = false;
    sessionExpired = false;
    sessionKilled = false;
    isReload = false;

    // console.log("load: detected reload -> new session:", SESSION_ID);
  } else {
    // navigate or back_forward or normal first load -> keep sessionStorage SESSION_ID
    SESSION_ID = getOrCreateSessionId();
    // console.log("load: navType:", navType, "session:", SESSION_ID);
  }

  // Reset flags (we've handled reload/restore logic)
  isNavigating = false;
  isPageVisible = true;
  clearTimeout(idleExitTimeout);
  clearTimeout(hiddenTabTimeout);
  isIdle = false;
  sessionExpired = false;

  if (!sessionStarted) {
    sessionStarted = true;
    sendEvent(pageViewEvent());
    // console.log("Session started:", SESSION_ID);
  } else {
    // console.log("Navigation within session:", SESSION_ID);
  }
});

// ===============================================
// Visibility change (keeps working as before)
// ===============================================
document.addEventListener("visibilitychange", () => {
  const state = document.visibilityState === "visible" ? "visible" : "hidden";
  isPageVisible = (state === "visible");

  if (sessionStarted) sendEvent(visibilityEvent(state));

  if (state === "hidden") {
    hiddenTabTimeout = setTimeout(() => {
      if (!sessionEnded) {
        sessionEnded = true;
        sessionExpired = true;
        sessionKilled = true;
        sendEvent(pageExitEvent());
        try { sessionStorage.removeItem("SESSION_ID"); } catch (err) {}
        // console.log("Session ended: hidden timeout");
      }
    }, HIDDEN_TAB_TIMEOUT);
  } else {
    if (hiddenTabTimeout) {
      clearTimeout(hiddenTabTimeout);
      hiddenTabTimeout = null;
    }

    if (sessionExpired && !sessionEnded) {
      SESSION_ID = generateSessionId();
      sessionStorage.setItem("SESSION_ID", SESSION_ID);
      sessionExpired = false;
      sessionStarted = false;
      sessionEnded = false;
      sessionKilled = false;
      isIdle = false;
      clearTimeout(idleExitTimeout);

      sessionStarted = true;
      sendEvent(pageViewEvent());
      // console.log("New session after return:", SESSION_ID);
    } else if (isIdle) {
      clearTimeout(idleExitTimeout);
      startIdleExitTimer();
    }
  }
});

// ===============================================
// Activity listeners & idle/heartbeat (unchanged behavior)
// ===============================================
window.addEventListener("mousemove", throttledMouseMove, { passive: true });
window.addEventListener("scroll", throttledScroll, { passive: true });
window.addEventListener("keydown", throttledKeydown);
window.addEventListener("click", throttledClick);

setInterval(() => {
  const now = getVietnamTimestamp();
  const inactive = now - lastActivityTime >= IDLE_LIMIT;

  if (inactive && !isIdle) {
    isIdle = true;
    sendEvent(idleEvent());
    startIdleExitTimer();
  }

  if (!inactive && isIdle) {
    isIdle = false;
    clearTimeout(idleExitTimeout);
    idleExitTimeout = null;
  }
}, 10000);

setInterval(() => {
  const now = getVietnamTimestamp();
  const active = now - lastActivityTime < IDLE_LIMIT;

  if (active && isPageVisible && !sessionEnded) {
    sendEvent(heartbeatEvent());
  }
}, HEARTBEAT_INTERVAL);

// ===============================================
// Idle exit timer (unchanged)
// ===============================================
function startIdleExitTimer() {
  idleExitTimeout = setTimeout(() => {
    if (!sessionEnded) {
      sessionEnded = true;
      sessionExpired = true;
      sessionKilled = true;
      sendEvent(pageExitEvent());
      try { sessionStorage.removeItem("SESSION_ID"); } catch (err) {}
      // console.log("Session ended: idle timeout");
    }
  }, IDLE_SESSION_TIMEOUT);
}

// ===============================================
// EXPOSE firePageExit for manual session termination
// ===============================================
window.firePageExit = function() {
  if (!sessionEnded) {
    sessionEnded = true;
    sessionExpired = true;
    sessionKilled = true;

    clearTimeout(idleExitTimeout);
    clearTimeout(hiddenTabTimeout);

    sendEvent(pageExitEvent());
    console.log("Session ended: manual sign-in/out");

    try {
      sessionStorage.removeItem("SESSION_ID");
    } catch (err) {}
  }
};

// init
// setupTracking(); 

console.log('end load file')