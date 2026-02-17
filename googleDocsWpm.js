export class GoogleDocsTracker {
  constructor(popup, settingsManager) {
    this.popup = popup
    this.settingsManager = settingsManager
    this.startTime = null
    this.hideTimeout = null
    this.charCount = 0
    this.MIN_CHARS_FOR_WPM = 1
    this.isTracking = false
    this.waitForEditor()
  }

  waitForEditor() {
    const iframe = document.querySelector('.docs-texteventtarget-iframe')
    if (iframe && iframe.contentDocument) {
      this.initializeEventListeners(iframe.contentDocument)
    } else {
      setTimeout(() => this.waitForEditor(), 500)
    }
  }

  initializeEventListeners(iframeDoc) {
    // Listen on the iframe's document for keypress events
    iframeDoc.addEventListener('keypress', (e) => this.handleKeyPress(e), { passive: true })

    // Also listen on main document as fallback
    document.addEventListener('keypress', (e) => this.handleKeyPress(e), { passive: true })
  }

  handleKeyPress(e) {
    if (!this.settingsManager.currentSettings.extensionEnabled) return
    // Only count printable characters (length 1)
    if (e.key.length !== 1) return
    this.updateWPM()
  }

  updatePopupPosition() {
    const settings = this.settingsManager.currentSettings

    this.popup.style.position = "fixed"
    this.popup.style.width = "fit-content"
    this.popup.style.height = "fit-content"
    this.popup.style.left = ""
    this.popup.style.right = ""
    this.popup.style.top = ""
    this.popup.style.bottom = ""

    const cursor = document.querySelector('.kix-cursor-caret')

    const positions = {
      cursor: () => {
        if (cursor) {
          const rect = cursor.getBoundingClientRect()
          this.popup.style.left = `${rect.left + 10}px`
          this.popup.style.top = `${rect.top - 30}px`
        } else {
          this.popup.style.right = "10px"
          this.popup.style.top = "60px"
        }
      },
      above: () => {
        if (cursor) {
          const rect = cursor.getBoundingClientRect()
          this.popup.style.left = `${rect.left}px`
          this.popup.style.top = `${rect.top - 40}px`
        } else {
          this.popup.style.right = "10px"
          this.popup.style.top = "60px"
        }
      },
      bottom: () => {
        if (cursor) {
          const rect = cursor.getBoundingClientRect()
          this.popup.style.left = `${rect.left}px`
          this.popup.style.top = `${rect.bottom + 20}px`
        } else {
          this.popup.style.right = "10px"
          this.popup.style.bottom = "10px"
        }
      },
      topRight: () => {
        this.popup.style.right = "10px"
        this.popup.style.top = "60px"
      },
      topLeft: () => {
        this.popup.style.left = "10px"
        this.popup.style.top = "60px"
      },
      bottomRight: () => {
        this.popup.style.right = "10px"
        this.popup.style.bottom = "10px"
      },
      bottomLeft: () => {
        this.popup.style.left = "10px"
        this.popup.style.bottom = "10px"
      },
    }

    const positionFunc = positions[settings.popupPosition]
    if (positionFunc) {
      positionFunc()
    }
  }

  updateWPM() {
    const now = performance.now()

    if (!this.startTime) {
      this.startTime = now
      this.charCount = 0
      this.updatePopupPosition()
      this.popup.style.visibility = "hidden"
      this.popup.textContent = "- wpm"
      this.isTracking = true
      return
    }

    this.charCount++

    if (this.charCount >= this.MIN_CHARS_FOR_WPM) {
      const timeElapsed = (now - this.startTime) / 1000 / 60
      const wpm = Math.round((this.charCount / 5) / timeElapsed)
      this.popup.style.visibility = "visible"
      this.popup.textContent = `${wpm} wpm`
      this.updatePopupPosition()
    }

    clearTimeout(this.hideTimeout)
    this.hideTimeout = setTimeout(() => {
      this.popup.style.visibility = "hidden"
      this.startTime = null
      this.charCount = 0
      this.isTracking = false
    }, this.settingsManager.currentSettings.timeout)
  }
}
