export class BaseTracker {
  constructor(popup, settingsManager) {
    this.popup = popup
    this.settingsManager = settingsManager
    this.startTime = null
    this.hideTimeout = null
    this.charCount = 0
    this.MIN_CHARS_FOR_WPM = 1
    this.isTracking = false
  }

  showPopup() {
    this.popup.classList.add('visible')
  }

  hidePopup() {
    this.popup.classList.remove('visible')
  }

  updatePopupPosition(target) {
    const settings = this.settingsManager.currentSettings

    this.popup.style.position = "fixed"
    this.popup.style.width = "fit-content"
    this.popup.style.height = "fit-content"
    this.popup.style.left = ""
    this.popup.style.right = ""
    this.popup.style.top = ""
    this.popup.style.bottom = ""

    const targetRect = target ? target.getBoundingClientRect() : null

    const positions = {
      textCursor: () => this.positionAtTextCursor(targetRect),
      cursor: () => this.positionAtTextCursor(targetRect), // backward compatibility
      mouse: () => this.positionAtMouse(targetRect),
      above: () => this.positionAbove(targetRect),
      bottom: () => this.positionBelow(targetRect),
      topRight: () => {
        this.popup.style.right = "10px"
        this.popup.style.top = "10px"
      },
      topLeft: () => {
        this.popup.style.left = "10px"
        this.popup.style.top = "10px"
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

  // Override in subclasses for custom positioning
  positionAtTextCursor(targetRect) {
    if (targetRect) {
      this.popup.style.left = `${targetRect.left}px`
      this.popup.style.top = `${targetRect.top - 40}px`
    } else {
      this.popup.style.right = "10px"
      this.popup.style.top = "10px"
    }
  }

  positionAtMouse(targetRect) {
    if (targetRect) {
      this.popup.style.left = `${targetRect.left}px`
      this.popup.style.top = `${targetRect.top - 40}px`
    } else {
      this.popup.style.right = "10px"
      this.popup.style.top = "10px"
    }
  }

  positionAbove(targetRect) {
    if (targetRect) {
      this.popup.style.left = `${targetRect.left}px`
      this.popup.style.top = `${targetRect.top - 40}px`
    } else {
      this.popup.style.right = "10px"
      this.popup.style.top = "10px"
    }
  }

  positionBelow(targetRect) {
    if (targetRect) {
      this.popup.style.left = `${targetRect.left}px`
      this.popup.style.top = `${targetRect.bottom + 20}px`
    } else {
      this.popup.style.right = "10px"
      this.popup.style.bottom = "10px"
    }
  }

  calculateWPM(charCount, startTime) {
    const now = performance.now()
    const timeElapsed = (now - startTime) / 1000 / 60
    return Math.round((charCount / 5) / timeElapsed)
  }

  shouldUpdatePositionDynamically() {
    const position = this.settingsManager.currentSettings.popupPosition
    return position === "textCursor" || position === "cursor" || position === "mouse"
  }

  updateWPM(target) {
    const now = performance.now()

    if (!this.startTime) {
      this.startTime = now
      this.charCount = 0
      this.updatePopupPosition(target)
      this.hidePopup()
      this.popup.textContent = "- wpm"
      this.isTracking = true
      return
    }

    this.charCount++

    // Update position dynamically for cursor-following modes
    if (this.shouldUpdatePositionDynamically()) {
      this.updatePopupPosition(target)
    }

    if (this.charCount >= this.MIN_CHARS_FOR_WPM) {
      const wpm = this.calculateWPM(this.charCount, this.startTime)
      this.showPopup()
      this.popup.textContent = `${wpm} wpm`
    }

    clearTimeout(this.hideTimeout)
    this.hideTimeout = setTimeout(() => {
      this.hidePopup()
      this.startTime = null
      this.charCount = 0
      this.isTracking = false
    }, this.settingsManager.currentSettings.timeout)
  }
}
