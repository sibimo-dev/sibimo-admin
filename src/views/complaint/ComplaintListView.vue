<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import Tag from "primevue/tag";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import AppDataTable from "@/components/common/AppDataTable.vue";
import AppButton from "@/components/common/AppButton.vue";
import { getComplaints } from "@/services/complaint.service";
import { getListCache, setListCache } from "@/services/list-cache";
const router = useRouter();
const cachedRows = getListCache("complaints");
const rows = ref((cachedRows ?? []).map(mapComplaint));
const loading = ref(!cachedRows);
const loadError = ref("");
const searchQuery = ref("");
const statusFilters = [
  { label: "Semua Status", value: "" },
  { label: "Menunggu", value: "Submitted" },
  { label: "Diproses", value: "In Progress" },
  { label: "Selesai", value: "Resolved" },
  { label: "Ditolak", value: "Rejected" },
];
const activeFilter = ref("");
const columns = [
  { field: "complaint_code", header: "ID / Tanggal", sortable: true },
  { field: "reporter_name", header: "Pelapor & Topik", sortable: true },
  { field: "category", header: "Kategori", sortable: true },
  { field: "status", header: "Status" },
];
const statusMeta = {
  Submitted: { label: "Menunggu Verifikasi", severity: "warn" },
  "In Progress": { label: "Sedang Diproses", severity: "info" },
  Resolved: { label: "Selesai", severity: "success" },
  Rejected: { label: "Ditolak", severity: "danger" },
};
const categoryMeta = {
  Infrastructure: "Infrastruktur",
  "Public Service": "Pelayanan Publik",
  Environment: "Lingkungan",
  Security: "Keamanan",
  Other: "Lainnya",
};
const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return rows.value.filter((r) => {
    if (activeFilter.value && r.status !== activeFilter.value) return false;
    if (!q) return true;
    return `${r.complaint_id} ${r.reporter_name} ${r.title}`
      .toLowerCase()
      .includes(q);
  });
});
const stats = computed(() => ({
  total: rows.value.length,
  submitted: rows.value.filter((r) => r.status === "Submitted").length,
  progress: rows.value.filter((r) => r.status === "In Progress").length,
  resolved: rows.value.filter((r) => r.status === "Resolved").length,
}));
function mapComplaint(item) {
  const hasReporterData = Boolean(
    item.reporter_name?.trim() || item.reporter_phone?.trim()
  );

  return {
    ...item,
    complaint_code: `#AD-${String(item.submitted_at ?? "").slice(0, 10)}-${
      item.complaint_id
    }`,
    reporter_name: hasReporterData ? item.reporter_name : "Anonim",
    phone: hasReporterData ? item.reporter_phone : "Anonim",
    submitted_at: item.submitted_at
      ? new Date(item.submitted_at).toLocaleString("id-ID")
      : "-",
  };
}
async function loadComplaints({ background = false } = {}) {
  if (!background) loading.value = true;
  try {
    const data = (await getComplaints()).map(mapComplaint);
    setListCache("complaints", data);
    rows.value = data;
    loadError.value = "";
  } catch (error) {
    loadError.value =
      error.response?.data?.message ?? "Gagal memuat pengaduan.";
    if (!background) rows.value = [];
  } finally {
    if (!background) loading.value = false;
  }
}
onMounted(() => loadComplaints({ background: Boolean(cachedRows) }));
</script>
<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 m-0">Kelola Pengaduan</h1>
    <p class="text-sm text-gray-500 mb-6">
      Kelola laporan pengaduan masyarakat.
    </p>
    <p v-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card
        ><template #content
          ><div class="text-xs text-gray-500">TOTAL ADUAN</div>
          <div class="text-3xl font-bold mt-2">{{ stats.total }}</div></template
        ></Card
      ><Card
        ><template #content
          ><div class="text-xs text-gray-500">MENUNGGU VERIFIKASI</div>
          <div class="text-3xl font-bold mt-2">
            {{ stats.submitted }}
          </div></template
        ></Card
      ><Card
        ><template #content
          ><div class="text-xs text-gray-500">SEDANG DIPROSES</div>
          <div class="text-3xl font-bold mt-2">
            {{ stats.progress }}
          </div></template
        ></Card
      ><Card
        ><template #content
          ><div class="text-xs text-gray-500">SELESAI</div>
          <div class="text-3xl font-bold mt-2">
            {{ stats.resolved }}
          </div></template
        ></Card
      >
    </div>
    <Card
      ><template #content
        ><div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex flex-wrap items-center gap-2">
            <AppButton
              v-for="filter in statusFilters"
              :key="filter.value"
              :label="filter.label"
              size="small"
              :variant="activeFilter === filter.value ? 'primary' : 'outline'"
              @click="activeFilter = filter.value"
            />
          </div>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Cari ID, pelapor, atau topik..."
              class="w-72"
            />
          </IconField>
        </div>
        <div class="complaint-table">
        <AppDataTable
          :columns="columns"
          :rows="filteredRows"
          :loading="loading"
          data-key="complaint_id"
          ><template #complaint_code="{ data }"
            ><strong>{{ data.complaint_code }}</strong>
            <div class="text-xs text-gray-400">
              {{ data.submitted_at }}
            </div></template
          ><template #reporter_name="{ data }"
            ><div class="font-medium">{{ data.reporter_name }}</div>
            <div class="text-sm font-semibold">{{ data.title }}</div>
            <div class="text-xs text-gray-500 line-clamp-2">
              {{ data.description }}
            </div></template
          ><template #category="{ data }"
            ><Tag
              :value="categoryMeta[data.category] ?? data.category"
              severity="secondary" /></template
          ><template #status="{ data }"
            ><Tag
              :value="statusMeta[data.status]?.label ?? data.status"
              :severity="statusMeta[data.status]?.severity" /></template
          ><template #actions="{ data }"
            ><AppButton
              label="Detail"
              variant="secondary"
              outlined
              size="small"
              @click="
                router.push({
                  name: 'complaint-response',
                  params: { id: data.complaint_id },
                })
              " /></template></AppDataTable>
        </div></template
    ></Card>
  </div>
</template>

<style scoped>

.complaint-table :deep(.p-datatable-table) { table-layout: fixed; width: 100%; }
.complaint-table :deep(th:nth-child(1)), .complaint-table :deep(td:nth-child(1)) { width: 18%; }
.complaint-table :deep(th:nth-child(2)), .complaint-table :deep(td:nth-child(2)) { width: 40%; }
.complaint-table :deep(th:nth-child(3)), .complaint-table :deep(td:nth-child(3)) { width: 16%; }
.complaint-table :deep(th:nth-child(4)), .complaint-table :deep(td:nth-child(4)) { width: 16%; }
.complaint-table :deep(th:nth-child(5)), .complaint-table :deep(td:nth-child(5)) { width: 10%; }
</style>