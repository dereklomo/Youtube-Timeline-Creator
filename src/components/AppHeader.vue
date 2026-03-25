<script setup>
import { ref } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const store = useTimelineStore()
const urlInput = ref('')
const error = ref('')

function handleLoad() {
  error.value = ''
  const success = store.loadVideo(urlInput.value.trim())
  if (!success) {
    error.value = 'Invalid YouTube URL. Please paste a valid link.'
  }
}
</script>

<template>
  <header class="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
      <h1 class="text-lg font-semibold text-white tracking-tight whitespace-nowrap flex items-center gap-2.5">
        <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5S0 8.7 0 10.9v2.2c0 2.2.5 4.4.5 4.4a3 3 0 0 0 2.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1s.5-2.2.5-4.4v-2.2c0-2.2-.5-4.4-.5-4.4zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
        </svg>
        Timeline Generator
      </h1>

      <div class="flex-1 flex items-center gap-2.5 w-full sm:w-auto">
        <input
          v-model="urlInput"
          type="text"
          placeholder="Paste YouTube URL here..."
          class="flex-1 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm
                 text-zinc-200 placeholder-zinc-600
                 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/30
                 transition-all duration-200"
          @keydown.enter="handleLoad"
        />
        <button
          @click="handleLoad"
          class="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-medium
                 px-5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap
                 shadow-lg shadow-red-900/20 hover:shadow-red-900/30
                 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Load Video
        </button>
      </div>

      <p v-if="error" class="text-red-400 text-xs mt-1 sm:mt-0">{{ error }}</p>
    </div>
  </header>
</template>
