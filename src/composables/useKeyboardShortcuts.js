import { onMounted, onBeforeUnmount } from 'vue'

/**
 * Context-aware keyboard shortcuts.
 *
 * Global (focus NOT in input):
 *   Space        → Toggle play/pause
 *   Enter        → Capture current time + focus description input
 *   ArrowLeft    → Seek -5s
 *   ArrowRight   → Seek +5s
 *   Ctrl+Z       → Undo
 *   Ctrl+Y       → Redo
 *
 * Input-focused shortcuts are handled by TimelineInput component.
 */
export function useKeyboardShortcuts(handlers) {
  function isInInput() {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (el.isContentEditable) return true
    if (tag === 'IFRAME') return true
    return false
  }

  function onKeydown(e) {
    // ── Global state: focus NOT in input ──
    if (!isInInput()) {
      // Ctrl + Z: Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handlers.undo?.()
        return
      }
      // Ctrl + Y or Ctrl + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        handlers.redo?.()
        return
      }

      if (e.key === ' ') {
        e.preventDefault() // prevent page scroll
        handlers.togglePlay?.()
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        handlers.captureTime?.()
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlers.seekBackward?.()
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handlers.seekForward?.()
        return
      }
    }

    // Input-focused shortcuts are handled by the TimelineInput component
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
