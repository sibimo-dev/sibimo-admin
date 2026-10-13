<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'

/**
 * Map picker: click the map to mark a location.
 * - `start` is the main point (always used).
 * - `end` is optional, for activities that cover a stretch (drainage, road).
 * Both are `{ lat, lng }` objects or null. Pins can be dragged to adjust.
 */
const props = defineProps({
  start: { type: Object, default: null },
  end: { type: Object, default: null },
  height: { type: String, default: '380px' },
})

const emit = defineEmits(['update:start', 'update:end'])

// Fallback center when no point has been chosen yet. Adjust to your village.
const DEFAULT_CENTER = [-7.7012, 110.463]
const DEFAULT_ZOOM = 15

const mapEl = ref(null)
const mode = ref('start')

const modeOptions = [
  { label: 'Titik awal (A)', value: 'start' },
  { label: 'Titik akhir (B)', value: 'end' },
]

const hint = computed(() => {
  if (!props.start) return 'Klik pada peta untuk menandai lokasi kegiatan.'
  if (mode.value === 'end') {
    return 'Klik pada peta untuk menandai titik akhir. Titik ini opsional.'
  }
  return 'Geser pin atau klik peta untuk memindahkan lokasi. Untuk kegiatan berupa jalur seperti drainase atau jalan, pilih "Titik akhir (B)" lalu tandai ujungnya.'
})

let map = null
let startMarker = null
let endMarker = null
let routeLine = null
let focusedByUser = false

function pinIcon(color, label) {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 34],
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;font-family:inherit;">${label}</span></div>`,
  })
}

function toPoint(latlng) {
  return {
    lat: Number(latlng.lat.toFixed(6)),
    lng: Number(latlng.lng.toFixed(6)),
  }
}

function buildMarker(point, color, label, eventName) {
  const marker = L.marker([point.lat, point.lng], {
    icon: pinIcon(color, label),
    draggable: true,
  }).addTo(map)
  marker.on('dragend', () => {
    focusedByUser = true
    emit(eventName, toPoint(marker.getLatLng()))
  })
  return marker
}

function syncMarkers() {
  if (!map) return

  if (props.start) {
    if (startMarker) startMarker.setLatLng([props.start.lat, props.start.lng])
    else startMarker = buildMarker(props.start, '#2563eb', 'A', 'update:start')
  } else if (startMarker) {
    startMarker.remove()
    startMarker = null
  }

  if (props.end) {
    if (endMarker) endMarker.setLatLng([props.end.lat, props.end.lng])
    else endMarker = buildMarker(props.end, '#dc2626', 'B', 'update:end')
  } else if (endMarker) {
    endMarker.remove()
    endMarker = null
  }

  if (props.start && props.end) {
    const points = [
      [props.start.lat, props.start.lng],
      [props.end.lat, props.end.lng],
    ]
    if (routeLine) routeLine.setLatLngs(points)
    else routeLine = L.polyline(points, { color: '#2563eb', weight: 4, dashArray: '8 8' }).addTo(map)
  } else if (routeLine) {
    routeLine.remove()
    routeLine = null
  }
}

function focusOnPoints() {
  if (!map || !props.start) return
  if (props.end) {
    map.fitBounds(
      L.latLngBounds([
        [props.start.lat, props.start.lng],
        [props.end.lat, props.end.lng],
      ]),
      { padding: [48, 48], maxZoom: 18 },
    )
  } else {
    map.setView([props.start.lat, props.start.lng], 17)
  }
}

function handleMapClick(event) {
  focusedByUser = true
  const point = toPoint(event.latlng)
  if (mode.value === 'end' && props.start) emit('update:end', point)
  else emit('update:start', point)
}

function clearEnd() {
  emit('update:end', null)
  mode.value = 'start'
}

function clearAll() {
  emit('update:start', null)
  emit('update:end', null)
  mode.value = 'start'
}

watch(
  () => [props.start, props.end],
  () => {
    syncMarkers()
    // Saved data loads after the map is created (edit page): jump to it once.
    if (!focusedByUser && props.start) {
      focusOnPoints()
      focusedByUser = true
    }
  },
  { deep: true },
)

onMounted(() => {
  map = L.map(mapEl.value, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    scrollWheelZoom: false, // avoid hijacking the page scroll
  })

  const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  })
  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles &copy; Esri' },
  )

  street.addTo(map)
  L.control.layers({ Satelit: satellite, Peta: street }, null, { position: 'topright' }).addTo(map)

  map.on('click', handleMapClick)

  syncMarkers()
  if (props.start) {
    focusOnPoints()
    focusedByUser = true
  }

  // Make sure tiles render correctly when the card finishes laying out.
  setTimeout(() => map?.invalidateSize(), 0)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SelectButton
        v-model="mode"
        :options="modeOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        size="small"
      />

      <div class="flex items-center gap-1">
        <Button
          v-if="end"
          label="Hapus titik akhir"
          icon="pi pi-times"
          size="small"
          severity="secondary"
          text
          type="button"
          @click="clearEnd"
        />
        <Button
          v-if="start"
          label="Hapus lokasi"
          icon="pi pi-trash"
          size="small"
          severity="danger"
          text
          type="button"
          @click="clearAll"
        />
      </div>
    </div>

    <p class="m-0 text-xs leading-relaxed text-slate-500">{{ hint }}</p>

    <!-- isolate keeps Leaflet's high z-index panes from overlapping the app UI -->
    <div class="isolate overflow-hidden rounded-xl border border-slate-200">
      <div ref="mapEl" class="w-full" :style="{ height }" />
    </div>
  </div>
</template>
