import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";

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

// createApp(App).mount('#app')
const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});

app.mount("#app");
