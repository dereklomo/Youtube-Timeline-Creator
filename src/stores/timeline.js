import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'yt-timeline-data'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/**
 * Parse a YouTube URL and extract the video ID.
 * Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID,
 *           youtube.com/shorts/ID, youtube.com/live/ID
 */
function extractVideoId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Convert seconds to MM:SS or HH:MM:SS display format.
 */
function formatTime(totalSeconds) {
  const seconds = Math.floor(totalSeconds)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(m)}:${pad(s)}`
}

export const useTimelineStore = defineStore('timeline', () => {
  // ─── State ────────────────────────────────────────
  const videoUrl = ref('')
  const videoId = ref('')
  const currentTime = ref(0)
  const isPlaying = ref(false)
  const timelineList = ref([])
  const undoStack = ref([])
  const redoStack = ref([])

  // ─── Restore from localStorage ────────────────────
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (Array.isArray(data.timelineList)) timelineList.value = data.timelineList
      if (data.videoUrl) videoUrl.value = data.videoUrl
      if (data.videoId) videoId.value = data.videoId
    }
  } catch { /* ignore corrupt data */ }

  // ─── Persist to localStorage on change ────────────
  watch(
    () => ({ timelineList: timelineList.value, videoUrl: videoUrl.value, videoId: videoId.value }),
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        timelineList: val.timelineList,
        videoUrl: val.videoUrl,
        videoId: val.videoId,
      }))
    },
    { deep: true }
  )

  // ─── Computed ─────────────────────────────────────
  const sortedTimeline = computed(() =>
    [...timelineList.value].sort((a, b) => a.timeInSeconds - b.timeInSeconds)
  )

  const exportText = computed(() => {
    return sortedTimeline.value
      .map((item) => {
        const prefix = item.isSubTopic ? '\u3000\u3000' : '' // Two full-width spaces
        return `${prefix}${item.displayTime}\u3000${item.description}`
      })
      .join('\n')
  })

  // ─── Undo helpers ─────────────────────────────────
  function pushUndo() {
    undoStack.value.push(JSON.stringify(timelineList.value))
    if (undoStack.value.length > 50) undoStack.value.shift()
    redoStack.value = []
  }

  // ─── Actions ──────────────────────────────────────
  function loadVideo(url) {
    const id = extractVideoId(url)
    if (!id) return false
    videoUrl.value = url
    videoId.value = id
    return true
  }

  function addTimelineItem(description, isSubTopic = false, timeOverride = null) {
    const time = timeOverride ?? currentTime.value
    const seconds = Math.floor(time)
    pushUndo()
    const existingIndex = timelineList.value.findIndex((item) => item.timeInSeconds === seconds)
    if (existingIndex !== -1) {
      timelineList.value[existingIndex].description = description.trim()
      timelineList.value[existingIndex].isSubTopic = isSubTopic
    } else {
      timelineList.value.push({
        id: generateId(),
        timeInSeconds: seconds,
        displayTime: formatTime(time),
        description: description.trim(),
        isSubTopic,
      })
    }
  }

  function deleteItem(id) {
    pushUndo()
    timelineList.value = timelineList.value.filter((item) => item.id !== id)
  }

  function updateItem(id, updates) {
    pushUndo()
    const item = timelineList.value.find((i) => i.id === id)
    if (!item) return
    if (updates.description !== undefined) item.description = updates.description
    if (updates.isSubTopic !== undefined) item.isSubTopic = updates.isSubTopic
    if (updates.timeInSeconds !== undefined) {
      item.timeInSeconds = Math.floor(updates.timeInSeconds)
      item.displayTime = formatTime(updates.timeInSeconds)
    }
  }

  function reorderItems(newList) {
    pushUndo()
    timelineList.value = newList
  }

  function undo() {
    if (undoStack.value.length === 0) return
    redoStack.value.push(JSON.stringify(timelineList.value))
    timelineList.value = JSON.parse(undoStack.value.pop())
  }

  function redo() {
    if (redoStack.value.length === 0) return
    undoStack.value.push(JSON.stringify(timelineList.value))
    timelineList.value = JSON.parse(redoStack.value.pop())
  }

  function clearAll() {
    pushUndo()
    timelineList.value = []
  }

  return {
    // state
    videoUrl,
    videoId,
    currentTime,
    isPlaying,
    timelineList,
    // computed
    sortedTimeline,
    exportText,
    // actions
    loadVideo,
    addTimelineItem,
    deleteItem,
    updateItem,
    reorderItems,
    undo,
    redo,
    clearAll,
    // helpers
    formatTime,
    canUndo: computed(() => undoStack.value.length > 0),
    canRedo: computed(() => redoStack.value.length > 0),
  }
})
