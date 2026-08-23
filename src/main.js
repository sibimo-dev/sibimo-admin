import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import router from './router'
import 'primeicons/primeicons.css'
import './assets/main.css'

const purgeLicenseElements = () => {
    const observer = new MutationObserver(() => {
        const licenseHost = document.getElementById("p-license-host");
        if (licenseHost) {
        licenseHost.remove();
        }

        const chartBanner = document.querySelector(".p-chart-license-banner");
        if (chartBanner) {
        chartBanner.remove();
        }

        const textEditorBanner = document.querySelector(
        ".p-text-editor-license-banner",
        );
        if (textEditorBanner) {
        textEditorBanner.remove();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
};

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", purgeLicenseElements);
}

const SibimoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6fb',
      100: '#d9ecf7',
      200: '#b0dbf1',
      300: '#7cc3e8',
      400: '#45a8dc',
      500: '#1e8fcb',
      600: '#1c72a8',
      700: '#235a86',
      800: '#264568',
      900: '#1f3350',
      950: '#152436',
    },
    secondary: {
      50: '#f2f7f5',
      100: '#deeae3',
      200: '#b4d0c1',
      300: '#8ab69f',
      400: '#5c9a79',
      500: '#2e7d53',
      600: '#296c49',
      700: '#235a3d',
      800: '#1d4731',
      900: '#183627',
      950: '#11281d',
    },
    success: {
      50: '#eef4f0',
      100: '#d6e6da',
      200: '#aeceb6',
      300: '#85b591',
      400: '#5f9c6e',
      500: '#488250',
      600: '#3a6941',
      700: '#2e5233',
      800: '#233d27',
      900: '#182a1b',
      950: '#101c12',
    },
    warn: {
      50: '#fbf7e6',
      100: '#f5ecc0',
      200: '#ebdd8c',
      300: '#dcc95c',
      400: '#c7b23e',
      500: '#ab982f',
      600: '#8b7b26',
      700: '#6e621e',
      800: '#524917',
      900: '#383210',
      950: '#25210b',
    },
    danger: {
      50: '#fdf1f1',
      100: '#f8dddd',
      200: '#efb8b8',
      300: '#e29494',
      400: '#d07575',
      500: '#b85c5c',
      600: '#9c4a4a',
      700: '#7d3b3b',
      800: '#5e2c2c',
      900: '#421f1f',
      950: '#2c1414',
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: SibimoPreset,
    options: {
      darkModeSelector: false,
    },
  },
 
  // license: import.meta.env.VITE_PRIMEUI_LICENSE,
})

app.use(ConfirmationService)
app.use(ToastService)

app.mount('#app')