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
</script>

<template>
  <div class="flex flex-col p-10 gap-6 min-h-0">
    <div class="flex items-start justify-between">
      <div class="flex items-end gap-5">
        <span class="text-[96px] font-bold leading-none tracking-tight">
          {{ temperature !== null ? `${temperature}°` : "–°" }}
        </span>
        <div class="flex flex-col pb-3 gap-1">
          <span class="text-4xl leading-none">{{ condition?.icon ?? "🌡️" }}</span>
          <span class="text-2xl text-neutral-300 leading-none">{{ condition?.label ?? "–" }}</span>
        </div>
      </div>
      <span class="text-5xl font-mono font-light text-neutral-300 tabular-nums">
        {{ timeStr }}
      </span>
    </div>

    <div class="text-2xl text-neutral-400">
      Fühlt sich an wie
      <span class="text-white font-medium">
        {{ apparentTemperature !== null ? `${apparentTemperature}°` : "–°" }}
      </span>
    </div>

    <div class="flex gap-10 text-2xl text-neutral-300 mt-auto">
      <span>💨 {{ windSpeed !== null ? `${windSpeed} km/h` : "–" }}</span>
      <span>🌧 {{ precipitation !== null ? `${precipitation} mm` : "–" }}</span>
    </div>

    <div v-if="error" class="absolute inset-0 flex items-center justify-center text-red-400 text-xl">
      Wetterdaten nicht verfügbar
    </div>
  </div>
</template>
