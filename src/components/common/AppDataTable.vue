<script setup>

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

defineProps({
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
})
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
