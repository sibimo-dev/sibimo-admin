<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Card from "primevue/card";
import Dialog from "primevue/dialog";
import Image from "primevue/image";
import Select from "primevue/select";
import Tag from "primevue/tag";
import {
  getComplaint,
  updateComplaintStatus,
} from "@/services/complaint.service";
import { getListCache, updateListCache } from "@/services/list-cache";

const route = useRoute();
const toast = useToast();

const cachedComplaint = getListCache("complaints")?.find(
  (item) => item.complaint_id === Number(route.params.id)
);
const loading = ref(!cachedComplaint);
const saving = ref(false);
const publishing = ref(false);
const isPublishDialogVisible = ref(false);

const complaint = reactive({
  complaint_id: null,
  status: "Submitted",
  category: "",
  title: "",
  description: "",
  submitted_at: "",
  reporter_name: "",
  reporter_phone: "",
  is_published: false,
  attachments: [],
  ...cachedComplaint,
});
const selectedStatus = ref(cachedComplaint?.status ?? "Submitted");

const statusOptions = [
  { label: "Menunggu Verifikasi", value: "Submitted" },
  { label: "Sedang Diproses", value: "In Progress" },
  { label: "Selesai", value: "Resolved" },
  { label: "Ditolak", value: "Rejected" },
];
const statusLabel = {
  Submitted: "Menunggu Verifikasi",
  "In Progress": "Sedang Diproses",
  Resolved: "Selesai",
  Rejected: "Ditolak",
};
const categoryLabel = {
  Infrastructure: "Infrastruktur",
  "Public Service": "Pelayanan Publik",
  Environment: "Lingkungan",
  Security: "Keamanan",
  Other: "Lainnya",
};
const statusPillClass = {
  Submitted: "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
};

const accentButtonClass =
  "bg-(--accent)! border-(--accent)! text-white! hover:bg-(--accent)/90! hover:border-(--accent)/90!";
const accentOutlinedButtonClass =
  "bg-transparent! border-(--accent)! text-(--accent)! hover:bg-(--accent-bg)!";
const neutralOutlinedButtonClass =
  "bg-transparent! border-(--border)! text-(--text-h)! hover:bg-(--accent-bg)!";

function getErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

async function loadComplaint({ background = false } = {}) {
  if (!background) loading.value = true;
  try {
    Object.assign(complaint, await getComplaint(route.params.id));
    selectedStatus.value = complaint.status;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Gagal memuat pengaduan",
      detail: getErrorMessage(error, "Coba lagi."),
      life: 3500,
    });
  } finally {
    if (!background) loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const result = await updateComplaintStatus(complaint.complaint_id, {
      status: selectedStatus.value,
    });
    complaint.status = result.complaint?.status ?? selectedStatus.value;
    updateListCache("complaints", (items) =>
      items.map((item) =>
        item.complaint_id === complaint.complaint_id
          ? { ...item, status: complaint.status }
          : item
      )
    );
    toast.add({
      severity: "success",
      summary: "Status pengaduan diperbarui",
      life: 2500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Gagal memperbarui status",
      detail: getErrorMessage(error, "Coba lagi."),
      life: 3500,
    });
  } finally {
    saving.value = false;
  }
}

function openPublishDialog() {
  isPublishDialogVisible.value = true;
}

async function handlePublish() {
  publishing.value = true;
  try {
    complaint.is_published = true;

    updateListCache("complaints", (items) =>
      items.map((item) =>
        item.complaint_id === complaint.complaint_id
          ? { ...item, is_published: true }
          : item
      )
    );

    isPublishDialogVisible.value = false;
    toast.add({
      severity: "success",
      summary: "Aduan berhasil dipublikasikan",
      life: 2500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Gagal mempublikasikan aduan",
      detail: getErrorMessage(error, "Coba lagi."),
      life: 3500,
    });
  } finally {
    publishing.value = false;
  }
}

function printComplaint() {
  const win = window.open("", "_blank", "width=850,height=1000");
  if (!win) {
    toast.add({
      severity: "warn",
      summary: "Popup diblokir",
      detail: "Izinkan popup untuk mencetak laporan.",
      life: 3000,
    });
    return;
  }

  const pillClass =
    statusPillClass[complaint.status] ?? "bg-gray-100 text-gray-700";
  const category = categoryLabel[complaint.category] || complaint.category;

  const formattedDate = complaint.submitted_at
    ? new Date(complaint.submitted_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const attachmentsHtml = complaint.attachments?.length
    ? `<div class="grid grid-cols-4 gap-2">${complaint.attachments
        .map(
          (file) =>
            `<div class="aspect-square overflow-hidden rounded-lg border border-gray-200"><img src="${file.file_path}" class="h-full w-full object-cover" /></div>`
        )
        .join("")}</div>`
    : `<p class="text-xs italic text-gray-400">Tidak ada lampiran yang disertakan.</p>`;

  const mapsLink =
    complaint.latitude && complaint.longitude
      ? `<a class="mt-2 inline-block text-xs font-semibold text-blue-700 no-underline" href="https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}">Lihat titik lokasi di Google Maps →</a>`
      : "";

  const sectionLabelClass =
    "mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-gray-400 before:inline-block before:h-3 before:w-[3px] before:rounded-sm before:bg-blue-900 before:content-['']";
  const infoBoxClass =
    "rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-3";
  const infoLabelClass =
    "mb-0.5 text-[10.5px] font-semibold uppercase text-gray-400";

  win.document.write(`
    <html>
      <head>
        <title>Laporan Aduan #${complaint.complaint_id}</title>
        <meta charset="utf-8" />
        <script src="https://cdn.tailwindcss.com"><\/script>
      </head>
      <body class="mx-auto max-w-3xl px-14 py-12 text-[13.5px] leading-relaxed text-gray-800 print:px-8 print:py-6" style="font-family: 'Segoe UI', Arial, sans-serif;">
        <div class="mb-2 flex items-center gap-4 border-b-[3px] border-blue-900 pb-4">
          <div>
            <h1 class="m-0 text-base tracking-wide text-blue-900">PEMERINTAH KALURAHAN BIMOMARTANI</h1>
            <p class="mt-0.5 text-xs text-gray-500">Kapanewon Ngemplak, Kabupaten Sleman, Daerah Istimewa Yogyakarta</p>
          </div>
        </div>

        <div class="mb-1 mt-7 text-center">
          <h2 class="m-0 text-[15px] font-bold uppercase tracking-widest text-gray-900">Laporan Aduan Masyarakat</h2>
          <p class="mt-1 text-xs text-gray-500">Nomor Referensi: #${complaint.complaint_id}</p>
        </div>

        <div class="my-6 mb-5 flex items-center justify-between rounded-[10px] border border-gray-200 bg-slate-50 px-[18px] py-3.5">
          <div>
            <div class="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Tanggal Pelaporan</div>
            <div class="mt-0.5 font-bold text-gray-900">${formattedDate}</div>
          </div>
          <div>
            <div class="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Kategori</div>
            <div class="mt-0.5 font-bold text-gray-900">${category}</div>
          </div>
          <div>
            <div class="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Status</div>
            <span class="mt-0.5 inline-block rounded-full px-3.5 py-1 text-[11.5px] font-bold ${pillClass}">${statusLabel[complaint.status] ?? complaint.status}</span>
          </div>
        </div>

        <div class="mb-[22px]">
          <div class="${sectionLabelClass}">Informasi Pelapor</div>
          <div class="grid grid-cols-2 gap-3.5">
            <div class="${infoBoxClass}">
              <div class="${infoLabelClass}">Nama Pelapor</div>
              <div class="font-semibold text-gray-900">${complaint.reporter_name || "Anonim"}</div>
            </div>
            <div class="${infoBoxClass}">
              <div class="${infoLabelClass}">Nomor Telepon</div>
              <div class="font-semibold text-gray-900">${complaint.reporter_phone || "Anonim"}</div>
            </div>
          </div>
        </div>

        ${
          complaint.location
            ? `<div class="mb-[22px]">
                <div class="${sectionLabelClass}">Lokasi Kejadian</div>
                <div class="whitespace-pre-line rounded-lg border border-gray-100 bg-gray-50 px-4 py-3.5">
                  ${complaint.location}
                  ${mapsLink}
                </div>
              </div>`
            : ""
        }

        <div class="mb-[22px]">
          <div class="${sectionLabelClass}">Judul Aduan</div>
          <div class="mb-2.5 text-sm font-bold text-gray-900">${complaint.title}</div>
        </div>

        <div class="mb-[22px]">
          <div class="${sectionLabelClass}">Deskripsi Laporan</div>
          <div class="whitespace-pre-line rounded-lg border border-gray-100 bg-gray-50 px-4 py-3.5">${complaint.description}</div>
        </div>

        <div class="mb-[22px]">
          <div class="${sectionLabelClass}">Lampiran / Bukti Pendukung</div>
          ${attachmentsHtml}
        </div>

        <div class="mt-10 border-t border-gray-200 pt-3.5 text-center text-[10.5px] text-gray-400">
          Dokumen ini dicetak otomatis melalui Sistem Informasi Bimomartani (SIBIMO) pada ${new Date().toLocaleString("id-ID")}.
        </div>
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 1000);
}

onMounted(() => loadComplaint({ background: Boolean(cachedComplaint) }));
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="m-0 text-2xl font-bold text-gray-800">
        Detail Aduan #{{ complaint.complaint_id }}
      </h1>
      <p class="text-sm text-gray-500">
        Dibuat pada {{ complaint.submitted_at }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
    <div class="flex flex-col gap-5">
      <Card>
        <template #content>
          <h2 class="mb-4 font-semibold">Informasi Pelapor</h2>
          <p>Nama: {{ complaint.reporter_name || "Anonim" }}</p>
          <p>Nomor HP: {{ complaint.reporter_phone || "Anonim" }}</p>
        </template>
      </Card>

      <Card>
        <template #content>
          <h2 class="mb-4 font-semibold">{{ complaint.title }}</h2>
          <Tag :value="complaint.category" severity="secondary" />

          <div v-if="complaint.location" class="mt-4 rounded-lg bg-gray-50 p-3">
            <p class="text-sm font-semibold text-gray-700">Lokasi Kejadian</p>
            <p class="mt-1 text-sm text-gray-600">{{ complaint.location }}</p>
            <Button
              v-if="complaint.latitude && complaint.longitude"
              as="a"
              variant="link"
              size="small"
              target="_blank"
              :href="`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`"
              :label="`Lihat di Google Maps (${complaint.latitude}, ${complaint.longitude})`"
              class="mt-1.5 !p-0 text-xs font-medium underline"
            />
          </div>

          <p class="mt-4">{{ complaint.description }}</p>

          <h3 class="mb-2 mt-5 font-semibold">Lampiran</h3>
          <div
            v-if="complaint.attachments?.length"
            class="grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            <Image
              v-for="file in complaint.attachments"
              :key="file.attachment_id"
              :src="file.file_path"
              :alt="file.file_name"
              preview
              class="block aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              image-class="h-full w-full object-cover"
            />
          </div>
          <p v-else class="text-sm text-gray-400">Belum ada lampiran.</p>
        </template>
      </Card>
    </div>

    <Card>
      <template #content>
        <h2 class="mb-4 font-semibold">Status &amp; Tindakan</h2>
        <Tag
          :value="statusLabel[complaint.status] ?? complaint.status"
          severity="info"
          class="mb-3"
        />
        <Select
          v-model="selectedStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="mb-3 w-full"
        />
        <Button
          label="Simpan Perubahan"
          class="w-full"
          :loading="saving"
          @click="handleSave"
        />
        <Button
          label="Publish Aduan"
          icon="pi pi-send"
          class="mt-2 w-full"
          :class="accentButtonClass"
          :disabled="complaint.is_published"
          @click="openPublishDialog"
        />
        <Button
          label="Cetak Aduan"
          icon="pi pi-print"
          outlined
          class="mt-2 w-full"
          :class="accentOutlinedButtonClass"
          @click="printComplaint"
        />
      </template>
    </Card>

    <Dialog
      v-model:visible="isPublishDialogVisible"
      modal
      header="Konfirmasi Publish"
      class="w-[26rem] max-w-[90vw]"
      :closable="!publishing"
    >
      <p class="m-0 text-gray-600">
        Apakah Anda yakin ingin mempublikasikan aduan
        <strong>#{{ complaint.complaint_id }}</strong>? Aduan yang sudah
        dipublikasikan dapat dilihat oleh publik.
      </p>
      <template #footer>
        <Button
          label="Batal"
          outlined
          :class="neutralOutlinedButtonClass"
          :disabled="publishing"
          @click="isPublishDialogVisible = false"
        />
        <Button
          label="Lanjut Publish"
          :class="accentButtonClass"
          :loading="publishing"
          @click="handlePublish"
        />
      </template>
    </Dialog>
    </div>
  </div>
</template>