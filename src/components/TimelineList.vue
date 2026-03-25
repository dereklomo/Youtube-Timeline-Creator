<script setup>
import { ref } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const store = useTimelineStore()
const editingId = ref(null)
const editText = ref('')
const emit = defineEmits(['seek'])

function startEdit(item) {
  editingId.value = item.id
  editText.value = item.description
}

function saveEdit(id) {
  if (editText.value.trim()) store.updateItem(id, { description: editText.value.trim() })
  editingId.value = null
}

function cancelEdit() { editingId.value = null }

function handleEditKeydown(e, id) {
  if (e.key === 'Enter') { e.preventDefault(); saveEdit(id) }
  else if (e.key === 'Escape') cancelEdit()
}

function toggleSubTopic(item) {
  store.updateItem(item.id, { isSubTopic: !item.isSubTopic })
}

const dragIndex = ref(null)

function onDragStart(index, e) {
  dragIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
  e.target.classList.add('drag-ghost')
}
function onDragEnd(e) { e.target.classList.remove('drag-ghost'); dragIndex.value = null }
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
function onDrop(targetIndex) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return
  const list = [...store.sortedTimeline]
  const [moved] = list.splice(dragIndex.value, 1)
  list.splice(targetIndex, 0, moved)
  store.reorderItems(list)
  dragIndex.value = null
}
</script>

<template>
  <div class="rounded-2xl border border-white/[0.06] bg-zinc-900/50 flex flex-col min-h-0 shadow-lg shadow-black/20">
    <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
      <h2 class="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        Timeline
        <span class="text-zinc-600 font-normal ml-1">({{ store.sortedTimeline.length }})</span>
      </h2>
      <div class="flex gap-1.5">
        <button
          :disabled="!store.canUndo"
          @click="store.undo()"
          class="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]
                 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300
                 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
          title="Undo (Ctrl+Z)"
        >? Undo</button>
        <button
          :disabled="!store.canRedo"
          @click="store.redo()"
          class="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]
                 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300
                 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
          title="Redo (Ctrl+Y)"
        >? Redo</button>
        <button
          v-if="store.sortedTimeline.length > 0"
          @click="store.clearAll()"
          class="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/10
                 text-red-400 hover:bg-red-500/20 transition-all duration-200"
        >Clear All</button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
      <div
        v-if="store.sortedTimeline.length === 0"
        class="flex items-center justify-center h-32 text-zinc-600 text-sm font-light"
      >
        No entries yet. Press <kbd class="mx-1 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500 text-xs">Enter</kbd> to capture time.
      </div>

      <div
        v-for="(item, index) in store.sortedTimeline"
        :key="item.id"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragend="onDragEnd"
        @dragover="onDragOver"
        @drop="onDrop(index)"
        class="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200
               hover:bg-white/[0.03] cursor-grab active:cursor-grabbing"
        :class="{ 'pl-9': item.isSubTopic }"
      >
        <span class="text-zinc-700 group-hover:text-zinc-500 shrink-0 cursor-grab transition-colors duration-200">?</span>

        <span v-if="item.isSubTopic" class="text-zinc-600 text-xs shrink-0">?</span>

        <button
          @click="emit('seek', item.timeInSeconds)"
          class="font-mono text-[11px] bg-red-500/10 text-red-400 px-2.5 py-1 rounded-lg
                 hover:bg-red-500/20 transition-all duration-200 shrink-0 tabular-nums"
          :title="'Seek to ' + item.displayTime"
        >{{ item.displayTime }}</button>

        <template v-if="editingId === item.id">
          <input
            v-model="editText"
            class="flex-1 bg-zinc-950 border border-red-500/30 rounded-lg px-3 py-1.5 text-sm text-zinc-200
                   focus:outline-none focus:ring-1 focus:ring-red-500/40 transition-all duration-200"
            @keydown="handleEditKeydown($event, item.id)"
            @blur="saveEdit(item.id)"
            autofocus
          />
        </template>
        <template v-else>
          <span
            @dblclick="startEdit(item)"
            class="flex-1 text-sm text-zinc-300 truncate cursor-text"
            title="Double-click to edit"
          >{{ item.description }}</span>
        </template>

        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
          <button
            @click="toggleSubTopic(item)"
            class="text-[11px] px-2 py-1 rounded-lg transition-all duration-200"
            :class="item.isSubTopic
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08]'"
            :title="item.isSubTopic ? 'Make main topic' : 'Make sub-topic'"
          >?</button>
          <button
            @click="store.deleteItem(item.id)"
            class="text-[11px] px-2 py-1 rounded-lg bg-white/[0.04] text-zinc-500
                   hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
            title="Delete"
          >?</button>
        </div>
      </div>
    </div>
  </div>
</template>
