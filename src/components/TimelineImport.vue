<script setup>
import { ref } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const store = useTimelineStore()
const importText = ref('')
const showImport = ref(false)

function importTimeline() {
  const lines = importText.value.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    const isSubTopic = /^[\u3000\s]{2,}/.test(line)
    const trimmed = line.replace(/^[\u3000\s]+/, '')
    const timeMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)[\u3000\s]+(.+)/)
    if (!timeMatch) continue
    const timeParts = timeMatch[1].split(':').map(Number)
    let totalSeconds = 0
    if (timeParts.length === 3) totalSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
    else totalSeconds = timeParts[0] * 60 + timeParts[1]
    store.addTimelineItem(timeMatch[2].trim(), isSubTopic, totalSeconds)
  }
  importText.value = ''
  showImport.value = false
}
</script>

<template>
  <div>
    <button
      @click="showImport = !showImport"
      class="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-200 font-medium"
    >
      {{ showImport ? '? Hide Import' : '? Import existing timeline text' }}
    </button>

    <div v-if="showImport" class="mt-3 rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-5 shadow-lg shadow-black/20">
      <textarea
        v-model="importText"
        placeholder="Paste existing timeline text here...&#10;00:16 Title&#10;  32:19 Sub-topic"
        class="w-full h-32 bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm
               text-zinc-200 placeholder-zinc-600 font-mono resize-y
               focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/30
               transition-all duration-200"
      ></textarea>
      <button
        @click="importTimeline"
        :disabled="!importText.trim()"
        class="mt-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-medium
               px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-900/20
               disabled:opacity-20 disabled:cursor-not-allowed"
      >
        Import
      </button>
    </div>
  </div>
</template>
