const settingsURL = chrome.runtime.getURL("settings.js")
const baseTrackerURL = chrome.runtime.getURL("baseTracker.js")
const wpmURL = chrome.runtime.getURL("wpm.js")
const googleDocsWpmURL = chrome.runtime.getURL("googleDocsWpm.js")

function isGoogleDocs() {
  return window.location.hostname === 'docs.google.com' &&
         window.location.pathname.startsWith('/document/');
}

async function initialize() {
  try {
    // Load base tracker first (required by both trackers)
    await import(baseTrackerURL)

    // Load settings and appropriate tracker
    const [settingsModule, trackerModule] = await Promise.all([
      import(settingsURL),
      isGoogleDocs() ? import(googleDocsWpmURL) : import(wpmURL)
    ])

    const { SettingsManager } = settingsModule
    const TrackerClass = isGoogleDocs() ? trackerModule.GoogleDocsTracker : trackerModule.WPM

    // Initialize wpm widget
    const widget = document.createElement("div")
    widget.className = "wpm-widget"
    document.body.appendChild(widget)

    // Initialize settings and wait for them to load
    const settings = new SettingsManager()
    await settings.ready()

    // Initialize tracker after settings are ready
    const tracker = new TrackerClass(widget, settings)
  } catch (error) {
    console.error('TypeTrack: Error loading modules:', error)
  }
}

initialize()
