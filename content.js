const settingsURL = chrome.runtime.getURL("settings.js")
const wpmURL = chrome.runtime.getURL("wpm.js")
const googleDocsWpmURL = chrome.runtime.getURL("googleDocsWpm.js")

function isGoogleDocs() {
  return window.location.hostname === 'docs.google.com' &&
         window.location.pathname.startsWith('/document/');
}

// use promise.all to load both modules
Promise.all([
  import(settingsURL),
  isGoogleDocs() ? import(googleDocsWpmURL) : import(wpmURL)
]).then(([settingsModule, trackerModule]) => {
  const { SettingsManager } = settingsModule
  const TrackerClass = isGoogleDocs() ? trackerModule.GoogleDocsTracker : trackerModule.WPM

  // initialize wpm widget
  const widget = document.createElement("div")
  widget.className = "wpm-widget"
  document.body.appendChild(widget)

  // initialize settings
  const settings = new SettingsManager();

  // initialize tracker
  const tracker = new TrackerClass(widget, settings)

}).catch(error => {
  console.error('Error loading modules:', error)
});
