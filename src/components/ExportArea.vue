<script setup>
import { ref, nextTick } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const store = useTimelineStore()
const emit = defineEmits(['seek-to'])

const copied = ref(false)
const editingId = ref(null)
const editText = ref('')
const editInputRef = ref(null)

async function copyToClipboard() {
  if (!store.exportText) return
  try {
    await navigator.clipboard.writeText(store.exportText)
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = store.exportText
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function startEdit(item) {
  editingId.value = item.id
  editText.value = item.description
  nextTick(() => editInputRef.value?.focus())
}

function confirmEdit(item) {
  const trimmed = editText.value.trim()
  if (trimmed && trimmed !== item.description) {
    store.updateItem(item.id, { description: trimmed })
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}
</script>

<template>
  <div class="rounded-2xl border border-white/[0.06] bg-zinc-900/50 flex flex-col shadow-lg shadow-black/20">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
      <div class="flex items-center gap-3">
        <h2 class="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Timeline</h2>
        <span v-if="store.sortedTimeline.length" class="text-[11px] text-zinc-600 tabular-nums">
          {{ store.sortedTimeline.length }} entries
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="store.clearAll()"
          :disabled="!store.sortedTimeline.length"
          class="text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-200
                 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.06]
                 disabled:opacity-20 disabled:cursor-not-allowed"
        >Clear All</button>
        <button
          @click="copyToClipboard"
          :disabled="!store.exportText"
          class="text-xs font-medium px-4 py-1.5 rounded-xl transition-all duration-200
                 disabled:opacity-20 disabled:cursor-not-allowed"
          :class="copied
            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'"
        >
          {{ copied ? '✅ Copied!' : 'Copy to Clipboard' }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="flex flex-col">
      <!-- Empty state -->
      <div
        v-if="!store.sortedTimeline.length"
        class="px-5 py-10 text-center text-sm text-zinc-600 font-light"
      >
        No entries yet. Capture your first timeline marker above.
      </div>

      <!-- Timeline rows -->
      <div
        v-for="(item, index) in store.sortedTimeline"
        :key="item.id"
        class="group flex items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-white/[0.02]"
        :class="[
          index < store.sortedTimeline.length - 1 ? 'border-b border-white/[0.03]' : '',
          item.isSubTopic ? 'pl-12 pr-5' : 'px-5'
        ]"
      >
        <!-- Sub-topic indicator -->
        <span v-if="item.isSubTopic" class="text-zinc-600 text-xs select-none shrink-0">↳</span>

        <!-- Time badge (clickable → seekTo) -->
        <button
          @click="emit('seek-to', item.timeInSeconds)"
          class="font-mono text-xs tabular-nums px-2.5 py-1 rounded-lg shrink-0
                 bg-zinc-800/80 text-zinc-300 border border-white/[0.06]
                 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30
                 transition-all duration-150 cursor-pointer"
        >
          {{ item.displayTime }}
        </button>

        <!-- Description (or edit input) -->
        <div class="flex-1 min-w-0">
          <input
            v-if="editingId === item.id"
            ref="editInputRef"
            v-model="editText"
            @keydown.enter.prevent="confirmEdit(item)"
            @keydown.escape.prevent="cancelEdit"
            @blur="confirmEdit(item)"
            class="w-full bg-zinc-950/80 border border-red-500/30 rounded-lg px-3 py-1
                   text-sm text-zinc-200 outline-none focus:border-red-500/50"
          />
          <span
            v-else
            class="text-sm text-zinc-300 truncate block"
            :class="item.isSubTopic ? 'text-zinc-400' : ''"
          >
            {{ item.description }}
          </span>
        </div>

        <!-- Hover actions -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button
            @click="startEdit(item)"
            class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all duration-150"
            title="Edit"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            @click="store.deleteItem(item.id)"
            class="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            title="Delete"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
