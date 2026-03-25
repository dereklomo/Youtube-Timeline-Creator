<script setup>
import { ref } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const store = useTimelineStore()
const description = ref('')
const descriptionInput = ref(null)

const emit = defineEmits(['capture-time'])

function addItem(isSubTopic) {
  if (!description.value.trim()) return
  emit('capture-time')
  store.addTimelineItem(description.value.trim(), isSubTopic)
  description.value = ''
  descriptionInput.value?.blur()
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    addItem(false)
  } else if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault()
    addItem(true)
  } else if (e.key === 'Escape') {
    description.value = ''
    descriptionInput.value?.blur()
  }
}

function focusInput() {
  descriptionInput.value?.focus()
}

defineExpose({ focusInput })
</script>

<template>
  <div class="card-glow rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-5 shadow-lg shadow-black/20">
    <div class="flex items-center gap-2 mb-4">
      <h2 class="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Add Entry</h2>
      <div class="flex-1 h-px bg-white/[0.04]"></div>
      <span class="text-xs text-zinc-500 font-mono tabular-nums">
        {{ store.formatTime(store.currentTime) }}
      </span>
    </div>

    <div class="flex gap-2">
      <input
        ref="descriptionInput"
        v-model="description"
        type="text"
        placeholder="Enter description..."
        class="flex-1 bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm
               text-zinc-200 placeholder-zinc-600
               focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/30
               transition-all duration-200"
        @keydown="handleKeydown"
      />
      <button
        @click="addItem(false)"
        class="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-medium
               px-5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap
               shadow-lg shadow-red-900/20 hover:shadow-red-900/30"
        title="Add as main topic (Enter)"
      >
        Add
      </button>
      <button
        @click="addItem(true)"
        class="bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08]
               text-zinc-300 text-sm font-medium
               px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap"
        title="Add as sub-topic (Shift+Enter)"
      >
        > Sub
      </button>
    </div>

    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600">
      <span class="text-zinc-500 font-medium">When typing:</span>
      <span><kbd class="bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Enter</kbd> Add topic</span>
      <span><kbd class="bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Shift+Enter</kbd> Sub-topic</span>
      <span><kbd class="bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500">Esc</kbd> Cancel</span>
    </div>
  </div>
</template>
