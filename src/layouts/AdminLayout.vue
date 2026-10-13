<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import Breadcrumb from '@/components/layout/Breadcrumb.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import Toast from 'primevue/toast'
</script>

<template>
  <div class="flex h-screen overflow-hidden">
   
    <div class="print:hidden">
      <Sidebar />
    </div>

    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <div class="print:hidden">
        <Navbar />
      </div>


      <main class="flex-1 overflow-y-auto p-3 md:p-6 print:overflow-visible print:p-0">
        <Breadcrumb class="mb-4 print:hidden" />
        <router-view />
      </main>
    </div>


    <AppConfirmDialog />
    <Toast />
  </div>
</template>