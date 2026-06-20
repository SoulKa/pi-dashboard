<script setup lang="ts">
import { computed } from "vue";
import type { WeatherData } from "@/composables/useWeather";
import { getWeatherCondition } from "@/utils/wmo";

const props = defineProps<{
  weather: WeatherData | null;
  loading: boolean;
  error: Error | null;
  time: Date;
}>();

const timeStr = computed(() =>
  props.time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
);

const isEvening = computed(() => props.time.getHours() >= 18);

const temperature = computed(() =>
  props.weather !== null ? Math.round(props.weather.temperature) : null,
);

const apparentTemperature = computed(() =>
  props.weather !== null ? Math.round(props.weather.apparentTemperature) : null,
);

const condition = computed(() =>
  props.weather !== null
    ? getWeatherCondition(Math.round(props.weather.weatherCode))
    : null,
);

const windSpeed = computed(() =>
  props.weather !== null ? Math.round(props.weather.windSpeed) : null,
);

const precipitation = computed(() =>
  props.weather !== null ? props.weather.precipitation.toFixed(1) : null,
);

const tomorrow = computed(() => props.weather?.tomorrow ?? null);

const tomorrowPrecipClass = computed(() => {
  const p = tomorrow.value?.precipitationProbability ?? 0;
  return {
    "text-red-400": p > 50,
    "text-amber-400": p > 20 && p <= 50,
    "text-neutral-300": p <= 20,
  };
});

function formatHour(h: number): string {
  return String(h).padStart(2, "0") + ":00";
}
</script>

<template>
  <div class="flex flex-col p-10 justify-between min-h-0">
    <div class="flex items-start justify-between">
      <span class="text-lg text-neutral-500 font-medium tracking-widest uppercase">
        {{ isEvening ? "Morgen" : "Aktuell" }}
      </span>
      <span class="text-5xl font-mono font-light text-neutral-300 tabular-nums">
        {{ timeStr }}
      </span>
    </div>

    <div v-if="error" class="flex-1 flex items-center justify-center text-red-400 text-xl">
      Wetterdaten nicht verfügbar
    </div>

    <template v-else-if="isEvening && tomorrow !== null">
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="slot in tomorrow.slots"
          :key="slot.hour"
          class="flex flex-col items-center gap-3"
        >
          <span class="text-xl text-neutral-400 font-mono">{{ formatHour(slot.hour) }}</span>
          <span class="text-6xl leading-none">{{ getWeatherCondition(slot.weatherCode).icon }}</span>
          <span class="text-5xl font-bold leading-none">{{ slot.temperature }}°</span>
          <span class="text-xl text-neutral-300 text-center leading-tight">
            {{ getWeatherCondition(slot.weatherCode).label }}
          </span>
        </div>
      </div>

      <div class="flex justify-between items-center text-2xl">
        <span class="text-neutral-300">↑ {{ tomorrow.high }}°&nbsp;&nbsp;↓ {{ tomorrow.low }}°</span>
        <span class="font-semibold" :class="tomorrowPrecipClass">
          🌧 {{ tomorrow.precipitationProbability }}%&nbsp;&nbsp;{{ tomorrow.precipitationMm }} mm
        </span>
      </div>
    </template>

    <template v-else>
      <div class="flex items-end gap-5">
        <span class="text-[96px] font-bold leading-none tracking-tight">
          {{ temperature !== null ? `${temperature}°` : "–°" }}
        </span>
        <div class="flex flex-col pb-3 gap-1">
          <span class="text-4xl leading-none">{{ condition?.icon ?? "🌡️" }}</span>
          <span class="text-2xl text-neutral-300 leading-none">{{ condition?.label ?? "–" }}</span>
        </div>
      </div>

      <div class="text-2xl text-neutral-400">
        Fühlt sich an wie
        <span class="text-white font-medium">
          {{ apparentTemperature !== null ? `${apparentTemperature}°` : "–°" }}
        </span>
      </div>

      <div class="flex gap-10 text-2xl text-neutral-300">
        <span>💨 {{ windSpeed !== null ? `${windSpeed} km/h` : "–" }}</span>
        <span>🌧 {{ precipitation !== null ? `${precipitation} mm` : "–" }}</span>
      </div>
    </template>
  </div>
</template>
