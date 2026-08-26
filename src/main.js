import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.store'
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
      50: '#eaf6fd', 100: '#cdebfa', 200: '#9ad9f5', 300: '#5fc4ee',
      400: '#2fa6de', 500: '#1483c7', 600: '#136aa3', 700: '#175380',
      800: '#1c3f61', 900: '#22314f', 950: '#141f33',
    },
   
    secondary: {
      50: '#eef4fb', 100: '#d7e6f5', 200: '#aecbe9', 300: '#82aed9',
      400: '#5c93c6', 500: '#3d76ab', 600: '#2f5d88', 700: '#264a6c',
      800: '#1e3a54', 900: '#172c3f', 950: '#0f1e2b',
    },
    success: {
      50: '#eaf6ef', 100: '#cbe9d6', 200: '#98d3ae', 300: '#63bb85',
      400: '#3aa367', 500: '#1e7a46', 600: '#19643a', 700: '#144e2e',
      800: '#0f3a23', 900: '#0a2818', 950: '#06190f',
    },
    warn: {
      50: '#fdf6e8', 100: '#f9e6bd', 200: '#f1cd7e', 300: '#e6b348',
      400: '#d69f2c', 500: '#b8861f', 600: '#946c19', 700: '#715214',
      800: '#523c0f', 900: '#38290a', 950: '#241a06',
    },
    danger: {
      50: '#fdecea', 100: '#f9cdc8', 200: '#f0958a', 300: '#e65f4f',
      400: '#dd3a26', 500: '#d42e24', 600: '#ac251d', 700: '#851d17',
      800: '#611512', 900: '#420f0c', 950: '#2a0a08',
    },
  },
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: SibimoPreset,
    options: {
      darkModeSelector: false,
    },
  },

 
})

app.use(ConfirmationService)
app.use(ToastService)

const authStore = useAuthStore(pinia)
authStore.fetchCurrentUser().catch(() => undefined)

app.mount('#app')
