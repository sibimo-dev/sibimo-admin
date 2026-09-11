<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import Select from "primevue/select";
import Tag from "primevue/tag";
import AppButton from "@/components/common/AppButton.vue";
import {getComplaint,updateComplaintStatus,} from "@/services/complaint.service";
import { getListCache, updateListCache } from "@/services/list-cache";
const route = useRoute();
const router = useRouter();
const toast = useToast();
const cachedComplaint = getListCache("complaints")?.find(
  (item) => item.complaint_id === Number(route.params.id)
);
const loading = ref(!cachedComplaint);
const saving = ref(false);
const complaint = reactive({
  complaint_id: null,
  status: "Submitted",
  category: "",
  title: "",
  description: "",
  submitted_at: "",
  reporter_name: "",
  reporter_phone: "",
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
function messageFrom(error, fallback) {
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
      detail: messageFrom(error, "Coba lagi."),
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
      detail: messageFrom(error, "Coba lagi."),
      life: 3500,
    });
  } finally {
    saving.value = false;
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

  const statusColors = {
    Submitted: { bg: "#fef3c7", text: "#92400e" },
    "In Progress": { bg: "#dbeafe", text: "#1e40af" },
    Resolved: { bg: "#d1fae5", text: "#065f46" },
    Rejected: { bg: "#fee2e2", text: "#991b1b" },
  };
  const statusColor = statusColors[complaint.status] || { bg: "#f3f4f6", text: "#374151" };

  const categoryLabel = {
    Infrastructure: "Infrastruktur",
    "Public Service": "Pelayanan Publik",
    Environment: "Lingkungan",
    Security: "Keamanan",
    Other: "Lainnya",
  }[complaint.category] || complaint.category;

  const formattedDate = complaint.submitted_at
    ? new Date(complaint.submitted_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const attachmentsHtml = complaint.attachments?.length
    ? `<div class="attachment-grid">${complaint.attachments
        .map(
          (file) =>
            `<div class="attachment-item"><img src="${file.file_path}" /></div>`
        )
        .join("")}</div>`
    : `<p class="empty-text">Tidak ada lampiran yang disertakan.</p>`;

  const mapsLink =
    complaint.latitude && complaint.longitude
      ? `<a class="maps-link" href="https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}">Lihat titik lokasi di Google Maps →</a>`
      : "";

  win.document.write(`
    <html>
      <head>
        <title>Laporan Aduan #${complaint.complaint_id}</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1f2937;
            padding: 48px 56px;
            max-width: 780px;
            margin: 0 auto;
            font-size: 13.5px;
            line-height: 1.6;
          }

          .kop {
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 16px;
            margin-bottom: 8px;
          }
          .kop-text h1 {
            font-size: 16px;
            margin: 0;
            color: #1e3a8a;
            letter-spacing: 0.3px;
          }
          .kop-text p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #6b7280;
          }

          .doc-title {
            text-align: center;
            margin: 28px 0 4px;
          }
          .doc-title h2 {
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
            color: #111827;
          }
          .doc-title p {
            font-size: 12px;
            color: #6b7280;
            margin: 4px 0 0;
          }

          .top-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 24px 0 20px;
            padding: 14px 18px;
            background: #f8fafc;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
          }
          .meta-item .label {
            font-size: 10.5px;
            text-transform: uppercase;
            color: #9ca3af;
            font-weight: 600;
            letter-spacing: 0.4px;
          }
          .meta-item .value {
            font-size: 13.5px;
            font-weight: 700;
            color: #111827;
            margin-top: 2px;
          }
          .status-pill {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
            background: ${statusColor.bg};
            color: ${statusColor.text};
          }

          .section {
            margin-bottom: 22px;
          }
          .section-label {
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #9ca3af;
            font-weight: 700;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .section-label::before {
            content: "";
            width: 3px;
            height: 12px;
            background: #1e3a8a;
            border-radius: 2px;
            display: inline-block;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .info-box {
            background: #f9fafb;
            border: 1px solid #eef0f3;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .info-box .label {
            font-size: 10.5px;
            color: #9ca3af;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .info-box .value {
            font-size: 13.5px;
            font-weight: 600;
            color: #111827;
          }

          .content-box {
            background: #f9fafb;
            border: 1px solid #eef0f3;
            border-radius: 8px;
            padding: 14px 16px;
            font-size: 13.5px;
            color: #1f2937;
            white-space: pre-line;
          }

          .location-title {
            font-weight: 700;
            font-size: 14px;
            color: #111827;
            margin-bottom: 10px;
          }

          .maps-link {
            display: inline-block;
            margin-top: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #1d4ed8;
            text-decoration: none;
          }

          .attachment-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .attachment-item {
            aspect-ratio: 1 / 1;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }
          .attachment-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .empty-text {
            font-size: 12.5px;
            color: #9ca3af;
            font-style: italic;
          }

          .signature-area {
            margin-top: 48px;
            display: flex;
            justify-content: flex-end;
          }
          .signature-block {
            text-align: center;
            width: 220px;
          }
          .signature-block .place-date {
            font-size: 12.5px;
            margin-bottom: 64px;
          }
          .signature-block .name {
            font-size: 13px;
            font-weight: 700;
            text-decoration: underline;
          }
          .signature-block .role {
            font-size: 11.5px;
            color: #6b7280;
            margin-top: 2px;
          }

          .footer-note {
            margin-top: 40px;
            padding-top: 14px;
            border-top: 1px solid #e5e7eb;
            font-size: 10.5px;
            color: #9ca3af;
            text-align: center;
          }

          @media print {
            body { padding: 24px 32px; }
          }
        </style>
      </head>
      <body>
        <div class="kop">
          <div class="kop-text">
            <h1>PEMERINTAH KALURAHAN BIMOMARTANI</h1>
            <p>Kapanewon Ngemplak, Kabupaten Sleman, Daerah Istimewa Yogyakarta</p>
          </div>
        </div>

        <div class="doc-title">
          <h2>Laporan Aduan Masyarakat</h2>
          <p>Nomor Referensi: #${complaint.complaint_id}</p>
        </div>

        <div class="top-meta">
          <div class="meta-item">
            <div class="label">Tanggal Pelaporan</div>
            <div class="value">${formattedDate}</div>
          </div>
          <div class="meta-item">
            <div class="label">Kategori</div>
            <div class="value">${categoryLabel}</div>
          </div>
          <div class="meta-item">
            <div class="label">Status</div>
            <span class="status-pill">${statusLabel[complaint.status] ?? complaint.status}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Informasi Pelapor</div>
          <div class="info-grid">
            <div class="info-box">
              <div class="label">Nama Pelapor</div>
              <div class="value">${complaint.reporter_name || "Anonim"}</div>
            </div>
            <div class="info-box">
              <div class="label">Nomor Telepon</div>
              <div class="value">${complaint.reporter_phone || "Anonim"}</div>
            </div>
          </div>
        </div>

        ${
          complaint.location
            ? `<div class="section">
                <div class="section-label">Lokasi Kejadian</div>
                <div class="content-box">
                  ${complaint.location}
                  ${mapsLink}
                </div>
              </div>`
            : ""
        }

        <div class="section">
          <div class="section-label">Judul Aduan</div>
          <div class="location-title">${complaint.title}</div>
        </div>

        <div class="section">
          <div class="section-label">Deskripsi Laporan</div>
          <div class="content-box">${complaint.description}</div>
        </div>

        <div class="section">
          <div class="section-label">Lampiran / Bukti Pendukung</div>
          ${attachmentsHtml}
        </div>

        <div class="footer-note">
          Dokumen ini dicetak otomatis melalui Sistem Informasi Bimomartani (SIBIMO) pada ${new Date().toLocaleString("id-ID")}.
        </div>
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

onMounted(() => loadComplaint({ background: Boolean(cachedComplaint) }));
</script>
<template>
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
    <div class="flex flex-col gap-5">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 m-0">
          Detail Aduan #{{ complaint.complaint_id }}
        </h1>
        <p class="text-sm text-gray-500">
          Dibuat pada {{ complaint.submitted_at }}
        </p>
      </div>
    <Card>
        <template #content>
            <h2 class="font-semibold mb-4">Informasi Pelapor</h2>
            <p>Nama: {{ complaint.reporter_name || 'Anonim' }}</p>
            <p>Nomor HP: {{ complaint.reporter_phone || 'Anonim' }}</p>
        </template>
    </Card>
    <Card>
        <template #content>
            <h2 class="font-semibold mb-4">{{ complaint.title }}</h2>
            <Tag :value="complaint.category" severity="secondary" />
    
            <div v-if="complaint.location" class="mt-4 rounded-lg bg-gray-50 p-3">
                
                <p class="text-sm font-semibold text-gray-700">Lokasi Kejadian</p>
                <p class="text-sm text-gray-600 mt-1">{{ complaint.location }}</p>
                <a
                    v-if="complaint.latitude && complaint.longitude"
                    :href="`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`"
                    target="_blank"
                    class="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary-700 underline"
                >
                    Lihat di Google Maps ({{ complaint.latitude }}, {{ complaint.longitude }})
                </a>
            </div>

            <p class="mt-4">{{ complaint.description }}</p>

            <h3 class="font-semibold mt-5 mb-2">Lampiran</h3>
            <div v-if="complaint.attachments?.length" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <a
                v-for="file in complaint.attachments"
                :key="file.attachment_id"
                :href="file.file_path"
                target="_blank"
                class="block aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
                <img
                :src="file.file_path"
                :alt="file.file_name"
                class="h-full w-full object-cover"
                />
            </a>
            </div>
            <p v-else class="text-sm text-gray-400">Belum ada lampiran.</p>
        </template>
    </Card>
    </div>
    <Card
      ><template #content
        ><h2 class="font-semibold mb-4">Status &amp; Tindakan</h2> 
        <Tag
          :value="statusLabel[complaint.status] ?? complaint.status"
          severity="info"
          class="mb-3" /><Select
          v-model="selectedStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full mb-3" /><AppButton
        label="Simpan Perubahan"
        variant="primary"
        class="w-full"
        :loading="saving"
        @click="handleSave"
        />
        <AppButton
        label="Cetak Aduan"
        icon="pi pi-print"
        variant="secondary"
        outlined
        class="w-full mt-2"
        @click="printComplaint"
        />
    </template>
    ></Card>
  </div>
</template>
