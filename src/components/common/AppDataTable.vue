<script setup>
/**
 * AppDataTable - wrapper di atas PrimeVue DataTable untuk semua
 * halaman *-list (surat, aduan, berita, pengguna, dst).
 *
 * Kenapa dibungkus: supaya loading state, empty state, dan pagination
 * tampil SERAGAM di semua modul, dan kalau nanti mau ganti dari
 * client-side ke server-side pagination, cukup ubah di 1 file ini.
 *
 * Contoh pakai:
 *   <AppDataTable
 *     :columns="[
 *       { field: 'nomor_surat', header: 'Nomor Surat' },
 *       { field: 'nama_pemohon', header: 'Pemohon' },
 *       { field: 'status', header: 'Status' },
 *     ]"
 *     :rows="daftarSurat"
 *     :loading="isLoading"
 *   >
 *     <template #status="{ data }">
 *       <Tag :value="data.status" />
 *     </template>
 *     <template #actions="{ data }">
 *       <AppButton icon="pi pi-pencil" variant="ghost" @click="edit(data)" />
 *     </template>
 *   </AppDataTable>
 */
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

defineProps({
  columns: {
    type: Array, // [{ field, header, sortable? }]
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
      dataKey="id"
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
        <!-- Kalau parent kasih slot custom sesuai nama field, pakai itu.
             Kalau tidak, tampilkan value apa adanya. -->
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
