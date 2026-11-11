<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import Breadcrumb from '@/components/layout/Breadcrumb.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import Toast from 'primevue/toast'
</script>

<template>
  <div class="flex h-screen overflow-hidden print:h-auto print:overflow-visible print:block">
   
    <div class="print:hidden">
      <Sidebar />
    </div>

    <div class="flex-1 flex flex-col overflow-hidden min-w-0 print:h-auto print:overflow-visible print:block">
      <div class="print:hidden">
        <Navbar />
      </div>

      <main class="flex-1 overflow-y-auto p-3 md:p-6 print:overflow-visible print:p-0 print:h-auto print:block">
        <Breadcrumb class="mb-4 print:hidden" />
        <router-view />
      </main>
    </div>

    <div class="print:hidden">
      <AppConfirmDialog />
      <Toast
        :pt="{
          root: {
            class:
              'max-md:!left-0 max-md:!right-0 max-md:!mx-auto max-md:!w-[calc(100vw-2rem)] max-md:!top-3',
          },
        }"
      />
    </div>
  </div>
</template>