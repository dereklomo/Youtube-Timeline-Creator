<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const store = useTimelineStore()
const playerContainer = ref(null)
const viewMode = ref('video') // 'video' | 'audio'
const videoTitle = ref('')
const isEditingTime = ref(false)
const timeInputValue = ref('')
let player = null
let timeUpdateInterval = null

const thumbnailUrl = computed(() =>
  store.videoId ? `https://img.youtube.com/vi/${store.videoId}/hqdefault.jpg` : ''
)

const duration = computed(() => {
  if (player && typeof player.getDuration === 'function') {
    return player.getDuration() || 0
  }
  return 0
})

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = resolve
  })
}

function initPlayer(videoId) {
  if (player) { player.loadVideoById(videoId); videoTitle.value = ''; return }
  player = new window.YT.Player(playerContainer.value, {
    videoId,
    playerVars: { autoplay: 0, modestbranding: 1, rel: 0 },
    events: {
      onReady: fetchTitle,
      onStateChange: onPlayerStateChange,
    },
  })
}

function fetchTitle() {
  if (player && typeof player.getVideoData === 'function') {
    const data = player.getVideoData()
    if (data?.title) videoTitle.value = data.title
  }
}

function onPlayerStateChange(event) {
  const YT = window.YT
  if (!videoTitle.value) fetchTitle()
  if (event.data === YT.PlayerState.PLAYING) {
    store.isPlaying = true; startTimeSync()
  } else {
    store.isPlaying = false; stopTimeSync()
    if (player && typeof player.getCurrentTime === 'function')
      store.currentTime = player.getCurrentTime()
  }
}

function startTimeSync() {
  stopTimeSync()
  timeUpdateInterval = setInterval(() => {
    if (player && typeof player.getCurrentTime === 'function')
      store.currentTime = player.getCurrentTime()
  }, 250)
}

function stopTimeSync() {
  if (timeUpdateInterval) { clearInterval(timeUpdateInterval); timeUpdateInterval = null }
}

function togglePlayPause() {
  if (!player) return
  store.isPlaying ? player.pauseVideo() : player.playVideo()
}

function seekTo(seconds) {
  if (!player || typeof player.seekTo !== 'function') return
  player.seekTo(seconds, true)
  if (!store.isPlaying && typeof player.playVideo === 'function') {
    player.playVideo()
  }
}

function parseTimeToSeconds(str) {
  const parts = str.trim().split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

function startTimeEdit() {
  timeInputValue.value = store.formatTime(store.currentTime)
  isEditingTime.value = true
}

function commitTimeEdit() {
  isEditingTime.value = false
  const seconds = parseTimeToSeconds(timeInputValue.value)
  if (seconds != null && seconds >= 0) seekTo(seconds)
}

function cancelTimeEdit() {
  isEditingTime.value = false
}

defineExpose({ togglePlayPause, seekTo })

watch(() => store.videoId, async (newId) => {
  if (!newId) return
  await loadYouTubeAPI(); initPlayer(newId)
})

onMounted(async () => {
  if (store.videoId) { await loadYouTubeAPI(); initPlayer(store.videoId) }
})

onBeforeUnmount(() => {
  stopTimeSync()
  if (player && typeof player.destroy === 'function') player.destroy()
})
</script>

<template>
  <div>
    <!-- Mode Toggle -->
    <div v-if="store.videoId" class="flex justify-center mb-3">
      <div class="inline-flex rounded-xl bg-zinc-900/80 border border-white/[0.06] p-0.5">
        <button
          @click="viewMode = 'video'"
          class="px-4 py-1.5 text-xs font-medium rounded-[10px] transition-all duration-200"
          :class="viewMode === 'video'
            ? 'bg-zinc-700/80 text-zinc-100 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-300'"
        >🎬 Video</button>
        <button
          @click="viewMode = 'audio'"
          class="px-4 py-1.5 text-xs font-medium rounded-[10px] transition-all duration-200"
          :class="viewMode === 'audio'
            ? 'bg-zinc-700/80 text-zinc-100 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-300'"
        >🎧 Audio</button>
      </div>
    </div>

    <!-- Player Card -->
    <div class="rounded-2xl overflow-hidden border border-white/[0.06] bg-zinc-900/50 shadow-xl shadow-black/30">

      <!-- Iframe container — always in DOM, repositioned by mode -->
      <div
        :class="viewMode === 'video'
          ? 'relative w-full'
          : 'fixed -top-[9999px] -left-[9999px] w-px h-px opacity-0 pointer-events-none'"
        :style="viewMode === 'video' ? 'padding-top: 56.25%' : ''"
        aria-hidden="viewMode === 'audio'"
      >
        <div
          v-if="!store.videoId && viewMode === 'video'"
          class="absolute inset-0 flex items-center justify-center bg-zinc-950/50"
        >
          <div class="text-center">
            <svg class="w-14 h-14 mx-auto mb-4 text-zinc-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5S0 8.7 0 10.9v2.2c0 2.2.5 4.4.5 4.4a3 3 0 0 0 2.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1s.5-2.2.5-4.4v-2.2c0-2.2-.5-4.4-.5-4.4z"/>
              <path d="M9.7 15.5V8.5l6.3 3.5-6.3 3.5z" fill="#18181b"/>
            </svg>
            <p class="text-sm text-zinc-500 font-light">Paste a YouTube URL above to get started</p>
          </div>
        </div>
        <div v-show="store.videoId" ref="playerContainer" class="absolute inset-0"></div>
      </div>

      <!-- Audio Mode: Mini Audio Card -->
      <div v-if="viewMode === 'audio' && store.videoId" class="flex items-center gap-4 px-5 py-4">
        <img
          :src="thumbnailUrl"
          alt="Thumbnail"
          class="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/[0.06]"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-zinc-200 font-medium truncate mb-0.5" :title="videoTitle">
            {{ videoTitle || 'Audio Mode' }}
          </p>
          <div class="flex items-center gap-3">
            <button
              @click="togglePlayPause"
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
              :class="store.isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'"
            >
              <svg v-if="store.isPlaying" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              <svg v-else class="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <div class="font-mono text-sm text-zinc-300 tabular-nums">
              {{ store.formatTime(store.currentTime) }}
              <span class="text-zinc-600"> / {{ store.formatTime(duration) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No video placeholder for audio mode -->
      <div v-if="viewMode === 'audio' && !store.videoId" class="flex items-center justify-center py-8">
        <p class="text-sm text-zinc-500 font-light">Paste a YouTube URL above to get started</p>
      </div>

      <!-- Status bar -->
      <div class="flex items-center justify-between px-5 py-2.5 bg-zinc-950/60 border-t border-white/[0.04]">
        <div class="flex items-center gap-3 text-xs text-zinc-500">
          <span
            :class="store.isPlaying ? 'bg-green-500 shadow-green-500/50 shadow-sm' : 'bg-zinc-600'"
            class="w-1.5 h-1.5 rounded-full transition-all duration-300"
          ></span>
          <span class="font-medium">{{ store.isPlaying ? 'Playing' : 'Paused' }}</span>
        </div>
        <div class="flex items-center gap-3 min-w-0">
          <span v-if="videoTitle" class="text-xs text-zinc-500 truncate max-w-[200px]" :title="videoTitle">{{ videoTitle }}</span>
          <input
            v-if="isEditingTime"
            v-model="timeInputValue"
            @keydown.enter.prevent="commitTimeEdit"
            @keydown.escape.prevent="cancelTimeEdit"
            @blur="commitTimeEdit"
            @vue:mounted="({ el }) => el.focus()"
            class="font-mono text-xs text-zinc-200 tabular-nums shrink-0 w-16 bg-zinc-950/80 border border-red-500/40 rounded px-1.5 py-0.5 outline-none text-center"
          />
          <span
            v-else
            @click="startTimeEdit"
            class="font-mono text-xs text-zinc-300 tabular-nums shrink-0 cursor-pointer hover:text-red-400 transition-colors duration-150 px-1.5 py-0.5 rounded hover:bg-white/[0.04]" 
            title="Click to jump to a specific time"
          >{{ store.formatTime(store.currentTime) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
