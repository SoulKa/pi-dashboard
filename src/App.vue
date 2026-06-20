<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import WeatherCard from "@/components/WeatherCard.vue";
import TrainBoard from "@/components/TrainBoard.vue";
import { useWeather } from "@/composables/useWeather";
import { useTrains } from "@/composables/useTrains";

const { weather, loading: weatherLoading, error: weatherError } = useWeather();
const { departures, loading: trainsLoading, error: trainsError } = useTrains();

const currentTime = ref(new Date());
let clockTimer: ReturnType<typeof setInterval> | null = null;

function closeApp() { window.close(); }

onMounted(() => {
  clockTimer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (clockTimer !== null) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
});
</script>

<template>
  <div
    class="w-screen h-screen overflow-hidden grid bg-neutral-950 text-white"
    style="grid-template-rows: auto 1fr"
  >
    <WeatherCard
      :weather="weather"
      :loading="weatherLoading"
      :error="weatherError"
      :time="currentTime"
    />
    <TrainBoard
      :departures="departures"
      :loading="trainsLoading"
      :error="trainsError"
    />
    <button
      class="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-neutral-800/60 flex items-center justify-center text-neutral-500 text-xl hover:bg-neutral-700 hover:text-white active:scale-95 transition-all"
      @click="closeApp"
    >✕</button>
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0a;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
