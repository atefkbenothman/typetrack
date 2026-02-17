import { BaseTracker } from './baseTracker.js'

export class GoogleDocsTracker extends BaseTracker {
  constructor(popup, settingsManager) {
    super(popup, settingsManager)
    this.pollAttempts = 0
    this.maxPollAttempts = 20
    this.iframeDoc = null
    this.waitForEditor()
  }

  waitForEditor() {
    const iframe = document.querySelector('.docs-texteventtarget-iframe')
    if (iframe && iframe.contentDocument) {
      this.initializeEventListeners(iframe.contentDocument)
    } else {
      this.pollAttempts++
      if (this.pollAttempts < this.maxPollAttempts) {
        setTimeout(() => this.waitForEditor(), 500)
      } else {
        console.warn('TypeTrack: Could not find Google Docs editor after 10 seconds')
      }
    }
  }

  initializeEventListeners(iframeDoc) {
    // Store reference to prevent duplicate listeners
    if (this.iframeDoc === iframeDoc) return
    this.iframeDoc = iframeDoc

    // Listen on the iframe's document for keypress events
    iframeDoc.addEventListener('keypress', (e) => this.handleKeyPress(e), { passive: true })
  }

  handleKeyPress(e) {
    if (!this.settingsManager.currentSettings.extensionEnabled) return
    if (e.key.length !== 1) return
    this.updateWPMWithCursor()
  }

  updateWPMWithCursor() {
    const cursor = document.querySelector('.kix-cursor-caret')
    this.updateWPM(cursor)
  }

  positionAtTextCursor(targetRect) {
    if (targetRect) {
      this.popup.style.left = `${targetRect.left + 10}px`
      this.popup.style.top = `${targetRect.top - 30}px`
    } else {
      this.popup.style.right = "10px"
      this.popup.style.top = "60px"
    }
  }

  positionAtMouse(targetRect) {
    // For Google Docs, mouse position isn't tracked, so fall back to text cursor
    this.positionAtTextCursor(targetRect)
  }

  positionAbove(targetRect) {
    if (targetRect) {
      this.popup.style.left = `${targetRect.left}px`
      this.popup.style.top = `${targetRect.top - 40}px`
    } else {
      this.popup.style.right = "10px"
      this.popup.style.top = "60px"
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
}
