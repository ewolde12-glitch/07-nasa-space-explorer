
// =================================
// 1. Register Service Worker
// =================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register(
          "./service-worker.js"
        );

      console.log(
        "Service Worker registered successfully!",
        registration
      );
    } catch (error) {
      console.error(
        "Service Worker registration failed:",
        error
      );
    }
  });
}


// =================================
// 2. Offline Indicator
// =================================

const offlineStatus =
  document.getElementById("offlineStatus");

function updateOnlineStatus() {
  if (offlineStatus) {
    offlineStatus.hidden = navigator.onLine;
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

updateOnlineStatus();


// =================================
// 3. Custom Install Prompt
// =================================

let deferredPrompt;

const installButton =
  document.getElementById("installButton");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();

  deferredPrompt = event;

  if (installButton) {
    installButton.hidden = false;
  }
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    console.log("Install choice:", choice.outcome);

    deferredPrompt = null;
    installButton.hidden = true;
  });
}

window.addEventListener("appinstalled", () => {
  if (installButton) {
    installButton.hidden = true;
  }

  console.log("NASA Space Explorer installed!");
});


// =================================
// 4. Notification Permission
// =================================

const notificationButton =
  document.getElementById("notificationButton");

if (notificationButton) {
  notificationButton.addEventListener("click", async () => {

    if (!("Notification" in window)) {
      alert("Notifications are not supported.");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      alert("Service Workers are not supported.");
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      if (permission === "granted") {

        const registration =
          await navigator.serviceWorker.ready;

        await registration.showNotification(
          "NASA Space Explorer",
          {
            body: "Welcome! Your space exploration journey begins.",
            icon: "./icons/icon-192.png",
            badge: "./icons/icon-192.png"
          }
        );

        alert("Notification enabled successfully!");

      } else {
        alert("Notification permission was not granted.");
      }

    } catch (error) {
      console.error("Notification error:", error);
    }
  });
}
