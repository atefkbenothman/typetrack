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
    if (this.isTracking && this.popup.classList.contains('visible') && this.settingsManager.currentSettings.popupPosition === "mouse") {
      this.updatePopupPosition(this.currentTarget)
    }
  }

  handleKeyPress(e) {
    if (!this.isTextInput(e.target)) return
    if (!this.settingsManager.currentSettings.extensionEnabled) return
    if (e.key.length !== 1) return
    this.currentTarget = e.target
    this.updateWPM(e.target)
  }

  positionAtMouse(targetRect) {
    this.popup.style.left = `${this.lastCursorX}px`
    this.popup.style.top = `${this.lastCursorY - 40}px`
  }

  positionAtTextCursor(targetRect) {
    const caretPos = this.getCaretPosition(this.currentTarget)
    if (caretPos && isFinite(caretPos.left) && isFinite(caretPos.top)) {
      const top = Math.max(10, caretPos.top - 40)
      this.popup.style.left = `${Math.max(0, caretPos.left)}px`
      this.popup.style.top = `${top}px`
    } else if (targetRect) {
      const top = Math.max(10, targetRect.top - 40)
      this.popup.style.left = `${targetRect.left}px`
      this.popup.style.top = `${top}px`
    }
  }

  getCaretPosition(element) {
    if (!element) return null

    // For contenteditable elements
    if (element.hasAttribute("contenteditable")) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).cloneRange()
        range.collapse(false)
        const rect = range.getBoundingClientRect()
        if (rect.left !== 0 || rect.top !== 0) {
          return { left: rect.left, top: rect.top }
        }
        // Fallback to element position
        const elemRect = element.getBoundingClientRect()
        return { left: elemRect.left, top: elemRect.top }
      }
    }

    // For input and textarea elements
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      const elemRect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      const text = element.value.substring(0, element.selectionEnd)

      // Create mirror div to measure text width
      const mirror = document.createElement("div")
      mirror.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        visibility: hidden;
        white-space: pre;
        font-family: ${style.fontFamily};
        font-size: ${style.fontSize};
        font-weight: ${style.fontWeight};
        letter-spacing: ${style.letterSpacing};
      `
      mirror.textContent = text
      document.body.appendChild(mirror)

      const textWidth = mirror.getBoundingClientRect().width
      document.body.removeChild(mirror)

      // Calculate position
      const paddingLeft = parseFloat(style.paddingLeft) || 0
      const borderLeft = parseFloat(style.borderLeftWidth) || 0
      const scrollLeft = element.scrollLeft || 0

      return {
        left: elemRect.left + paddingLeft + borderLeft + textWidth - scrollLeft,
        top: elemRect.top
      }
    }

    return null
  }
}
