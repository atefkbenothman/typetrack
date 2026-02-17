const settingsUrl = chrome.runtime.getURL("settings.js")

class PopupManager {
  constructor(defaultSettings) {
    this.form = document.getElementById("settingsForm")
    this.previewWidget = document.getElementById("previewWidget")
    this.initialize(defaultSettings)
  }

  initialize(defaultSettings) {
    this.loadSettings(defaultSettings)
    this.form.addEventListener("submit", this.handleSubmit.bind(this))
    this.attachPreviewListeners()
  }

  async loadSettings(defaultSettings) {
    const settings = await chrome.storage.sync.get(defaultSettings)
    this.populateForm(settings)
    this.updatePreview()
    this.updateDisplayValues()
  }

  populateForm(settings) {
    const elements = {
      timeout: value => document.getElementById("timeout").value = value,
      fontSize: value => document.getElementById("fontSize").value = value,
      backgroundColor: value => document.getElementById("backgroundColor").value = value,
      opacity: value => document.getElementById("opacity").value = value,
      textColor: value => document.getElementById("textColor").value = value,
      popupPosition: value => document.getElementById("position").value = value,
      extensionEnabled: value => document.getElementById("extensionEnabled").checked = value,
    }
    Object.entries(settings).forEach(([key, value]) => {
      if (elements[key]) {
        elements[key](value)
      }
    })
  }

  attachPreviewListeners() {
    const previewInputs = ["backgroundColor", "textColor", "fontSize", "opacity"]
    previewInputs.forEach(id => {
      const element = document.getElementById(id)
      element.addEventListener("input", () => {
        this.updatePreview()
        this.updateDisplayValues()
      })
    })

    // Update display values for timeout slider
    document.getElementById("timeout").addEventListener("input", () => {
      this.updateDisplayValues()
    })
  }

  updatePreview() {
    const bgColor = document.getElementById("backgroundColor").value
    const textColor = document.getElementById("textColor").value
    const fontSize = document.getElementById("fontSize").value
    const opacity = document.getElementById("opacity").value

    // Convert hex to rgba for opacity
    const r = parseInt(bgColor.slice(1, 3), 16)
    const g = parseInt(bgColor.slice(3, 5), 16)
    const b = parseInt(bgColor.slice(5, 7), 16)
    const rgbaBackground = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`

    this.previewWidget.style.backgroundColor = rgbaBackground
    this.previewWidget.style.color = textColor
    this.previewWidget.style.fontSize = `${fontSize}px`
  }

  updateDisplayValues() {
    // Color values
    document.getElementById("bgColorValue").textContent =
      document.getElementById("backgroundColor").value.toUpperCase()
    document.getElementById("textColorValue").textContent =
      document.getElementById("textColor").value.toUpperCase()

    // Slider values
    document.getElementById("fontSizeValue").textContent =
      `${document.getElementById("fontSize").value}px`
    document.getElementById("opacityValue").textContent =
      `${document.getElementById("opacity").value}%`
    document.getElementById("timeoutValue").textContent =
      `${document.getElementById("timeout").value}ms`
  }

  getFormValues() {
    return {
      timeout: parseInt(document.getElementById('timeout').value),
      fontSize: parseInt(document.getElementById('fontSize').value),
      backgroundColor: document.getElementById('backgroundColor').value,
      opacity: parseInt(document.getElementById('opacity').value),
      textColor: document.getElementById('textColor').value,
      popupPosition: document.getElementById('position').value,
      extensionEnabled: document.getElementById('extensionEnabled').checked
    }
  }

  async updateContentScript(settings) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: "updateStyles",
        settings: settings
      })
    }
  }

  showStatus(duration = 2000) {
    const button = this.form.querySelector(".save-btn")
    const originalText = button.textContent
    button.textContent = "Settings saved!"
    setTimeout(() => {
      button.textContent = originalText
    }, duration)
  }

  async handleSubmit(e) {
    e.preventDefault()
    const settings = this.getFormValues()
    try {
      await chrome.storage.sync.set(settings)
      await this.updateContentScript(settings)
      this.showStatus()
    } catch (err) {
      console.error("error saving settings:", err)
    }
  }
}

function initializePopupManager(defaultSettings) {
  const startManager = () => {
    const popupManager = new PopupManager(defaultSettings)
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startManager)
  } else {
    startManager()
  }
}

import(settingsUrl)
  .then(({ DEFAULT_SETTINGS }) => {
    initializePopupManager(DEFAULT_SETTINGS)
  })
  .catch(err => {
    console.error("Error loading settings module:", err)
  })
