import { BaseTracker } from './baseTracker.js'

export class WPM extends BaseTracker {
  constructor(popup, settingsManager) {
    super(popup, settingsManager)
    this.lastCursorX = 0
    this.lastCursorY = 0
    this.initializeEventListeners()
  }

  initializeEventListeners() {
    document.addEventListener("mousemove", this.handleMouseMove.bind(this), { passive: true })
    document.addEventListener("keypress", this.handleKeyPress.bind(this), { passive: true })
  }

  isTextInput(element) {
    if (!element) return false
    const tag = element.tagName
    const isContentEditable = element.hasAttribute("contenteditable")
    const isTextArea = tag === "TEXTAREA"
    const isInput = tag === "INPUT" && !["button", "submit", "reset", "checkbox", "radio", "file"].includes(element.type || "")
    return isContentEditable || isTextArea || isInput
  }

  handleMouseMove(e) {
    this.lastCursorX = e.pageX
    this.lastCursorY = e.pageY
    if (this.isTracking && this.popup.classList.contains('visible') && this.settingsManager.currentSettings.popupPosition === "cursor") {
      this.updatePopupPosition(e.target)
    }
  }

  handleKeyPress(e) {
    if (!this.isTextInput(e.target)) return
    if (!this.settingsManager.currentSettings.extensionEnabled) return
    if (e.key.length !== 1) return
    this.currentTarget = e.target
    this.updateWPM(e.target)
  }

  positionAtCursor(targetRect) {
    this.popup.style.left = `${this.lastCursorX}px`
    this.popup.style.top = `${this.lastCursorY}px`
  }
}
