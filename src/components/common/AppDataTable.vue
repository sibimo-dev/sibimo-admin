<script setup>
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  loading: { type: Boolean, default: false },
  rowsPerPage: { type: Number, default: 10 },
  emptyMessage: { type: String, default: 'Belum ada data' },
  hasActions: { type: Boolean, default: true },
  dataKey: { type: String, default: 'id' },
  // --- Highlight row (dipakai untuk animasi "surat yang ditunjukkan") ---
  highlightField: { type: String, default: null }, // field yg dicocokkan, mis. 'requestId'
  highlightValue: { type: [String, Number], default: null }, // nilai yg dicari
  first: { type: Number, default: 0 }, // index awal paginator, biar bisa lompat ke halaman yg ada row-nya
})

function rowClass(data) {
  if (!props.highlightField || props.highlightValue == null) return ''
  return data[props.highlightField] === props.highlightValue ? 'row-highlight' : ''
}
</script>

<template>
  <div class="card !p-0 overflow-hidden">
    <DataTable
      :value="rows"
      :loading="loading"
      paginator
      :rows="rowsPerPage"
      :rowsPerPageOptions="[10, 25, 50]"
      :dataKey="dataKey"
      :first="first"
      :rowClass="rowClass"
      stripedRows
      responsiveLayout="scroll"
    >
      <template #empty>
        <div class="text-center text-neutral-400 py-8 text-sm">
          {{ emptyMessage }}
        </div>
      </template>

      <Column
        v-for="col in columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable ?? false"
      >

        <template v-if="$slots[col.field]" #body="slotProps">
          <slot :name="col.field" v-bind="slotProps" />
        </template>
      </Column>

      <Column v-if="hasActions" header="Aksi" style="width: 140px">
        <template #body="slotProps">
          <div class="flex gap-2">
            <slot name="actions" v-bind="slotProps" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
/* Animasi kedip untuk baris yang ditunjukkan (mis. dari klik "Verifikasi"/
   "Otorisasi" di halaman Pengelolaan Surat). Berjalan otomatis 5 detik lalu
   parent akan melepas prop highlightValue sehingga class ini ikut hilang. */
:deep(.p-datatable-tbody > tr.row-highlight) {
  animation: row-blink 1s ease-in-out 4;
}

@keyframes row-blink {
  0%,
  100% {
    background-color: transparent;
  }
  50% {
    background-color: #fef08a; /* kuning lembut, cukup kontras di atas stripedRows */
  }
}
</style>