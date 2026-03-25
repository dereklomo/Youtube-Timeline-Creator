<script setup>
import { ref } from "vue"
import { useTimelineStore } from "./stores/timeline"
import { useKeyboardShortcuts } from "./composables/useKeyboardShortcuts"
import AppHeader from "./components/AppHeader.vue"
import VideoPlayer from "./components/VideoPlayer.vue"
import TimelineInput from "./components/TimelineInput.vue"
import ExportArea from "./components/ExportArea.vue"

const store = useTimelineStore()
const playerRef = ref(null)
const inputRef = ref(null)

useKeyboardShortcuts({
  captureTime: () => { inputRef.value?.focusInput() },
  togglePlay: () => { playerRef.value?.togglePlayPause() },
  seekBackward: () => {
    const t = Math.max(0, store.currentTime - 5)
    playerRef.value?.seekTo(t)
  },
  seekForward: () => { playerRef.value?.seekTo(store.currentTime + 5) },
  undo: () => store.undo(),
  redo: () => store.redo(),
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-zinc-950">
    <AppHeader />

    <main class="flex-1 w-full max-w-4xl mx-auto px-5 py-6 flex flex-col gap-5">
      <VideoPlayer ref="playerRef" />
      <TimelineInput ref="inputRef" @capture-time="() => {}" />
      <ExportArea @seek-to="(t) => playerRef?.seekTo(t)" />
    </main>

    <footer class="border-t border-white/[0.04] px-6 py-4">
      <div class="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[11px] text-zinc-600">
        <span class="text-zinc-500 font-medium">Global:</span>
        <span><kbd class="bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Space</kbd> Play/Pause</span>
        <span><kbd class="bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Enter</kbd> Capture time</span>
        <span><kbd class="bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">←/→</kbd> Seek ±5s</span>
        <span class="text-zinc-500 font-medium ml-2">Input:</span>
        <span><kbd class="bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Enter</kbd> Add topic</span>
        <span><kbd class="bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Shift+Enter</kbd> Sub-topic</span>
        <span><kbd class="bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Esc</kbd> Cancel</span>
      </div>
    </footer>
  </div>
</template>
