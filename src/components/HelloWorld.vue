<script setup>
import { ref } from 'vue'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'
import vueLogo from '../assets/vue.svg'
import Button from 'primevue/button';
import {
  ChartLegend,
  ChartLine,
  ChartSvg,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
  ChartScatter,
} from "@primeui/vue-chart";

const count = ref(0)

const data = [
  { month: "Jan", revenue: 42, expenses: 31 },
  { month: "Feb", revenue: 55, expenses: 38 },
  { month: "Mar", revenue: 48, expenses: 35 },
  { month: "Apr", revenue: 63, expenses: 44 },
  { month: "May", revenue: 58, expenses: 40 },
  { month: "Jun", revenue: 72, expenses: 51 },
];
</script>

<template>
  <section id="center">
    <div class="hero">
      <img :src="heroImg" class="base" width="170" height="179" alt="" />
      <img :src="vueLogo" class="framework" alt="Vue logo" />
      <img :src="viteLogo" class="vite" alt="Vite logo" />
    </div>
    <div>
      <h1>Get started</h1>
      <p>Edit <code>src/App.vue</code> and save to test <code>HMR</code></p>
    </div>
    <button type="button" class="counter" @click="count++">
      Count is {{ count }}
    </button>
  </section>

  <div class="flex justify-center">
    <Button severity="help">Verify</Button>
  </div>

  <ChartSvg :height="400">
    <ChartLine
      :data="data"
      category-x-field="month"
      value-y-field="revenue"
      name="Revenue"
      curve="smooth"
      :show-markers="true"
    />
    <ChartLine
      :data="data"
      category-x-field="month"
      value-y-field="expenses"
      name="Expenses"
      curve="smooth"
      :show-markers="true"
    />
    <ChartXAxis />
    <ChartYAxis />
    <ChartLegend />
    <ChartTooltip />
  </ChartSvg>

  <div class="ticks"></div>

  <section id="next-steps">
    <div id="docs">
      <svg class="icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#documentation-icon"></use>
      </svg>
      <h2>Documentation</h2>
      <p>Your questions, answered</p>
      <ul>
        <li>
          <a href="https://vite.dev/" target="_blank">
            <img class="logo" :src="viteLogo" alt="" />
            Explore Vite
          </a>
        </li>
        <li>
          <a href="https://vuejs.org/" target="_blank">
            <img class="button-icon" :src="vueLogo" alt="" />
            Learn more
          </a>
        </li>
      </ul>
    </div>
    <div id="social">
      <svg class="icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#social-icon"></use>
      </svg>
      <h2>Connect with us</h2>
      <p>Join the Vite community</p>
      <ul>
        <li>
          <a href="https://github.com/vitejs/vite" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#github-icon"></use>
            </svg>
            GitHub
          </a>
        </li>
        <li>
          <a href="https://chat.vite.dev/" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#discord-icon"></use>
            </svg>
            Discord
          </a>
        </li>
        <li>
          <a href="https://x.com/vite_js" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#x-icon"></use>
            </svg>
            X.com
          </a>
        </li>
        <li>
          <a href="https://bsky.app/profile/vite.dev" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#bluesky-icon"></use>
            </svg>
            Bluesky
          </a>
        </li>
      </ul>
    </div>
  </section>

  <div class="ticks"></div>
  <section id="spacer"></section>
</template>
