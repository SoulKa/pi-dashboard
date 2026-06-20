<script setup lang="ts">
import { computed } from "vue";
import type { Departure } from "@/composables/useTrains";

const props = defineProps<{
  departures: Departure[];
  loading: boolean;
  error: Error | null;
}>();

const rows = computed(() => props.departures.slice(0, 6));

function countdownLabel(countdown: number): string {
  return countdown <= 0 ? "jetzt" : `${countdown}'`;
}
</script>

<template>
  <div class="flex flex-col min-h-0 border-t border-neutral-800">
    <div
      class="flex items-center justify-between px-10 py-5 border-b border-neutral-800 shrink-0"
    >
      <span class="text-2xl font-semibold text-neutral-300">Abfahrten</span>
      <span v-if="loading" class="text-lg text-neutral-500">Lädt…</span>
    </div>

    <div
      v-if="error"
      class="flex-1 flex items-center justify-center text-red-400 text-xl"
    >
      Abfahrten nicht verfügbar
    </div>

    <template v-else>
      <div
        v-for="(dep, i) in rows"
        :key="i"
        class="flex-1 flex items-center gap-5 px-10 border-b border-neutral-800/50"
        :class="{ 'bg-neutral-900/40': i % 2 === 1 }"
      >
        <span
          class="w-16 h-9 rounded text-base font-bold flex items-center justify-center shrink-0"
          :class="{
            'bg-green-700': /^S\d/.test(dep.line),
            'bg-blue-700': /^U\d/.test(dep.line),
            'bg-neutral-700': !/^[SU]\d/.test(dep.line),
          }"
        >
          {{ dep.line }}
        </span>

        <span class="flex-1 text-xl truncate">{{ dep.direction }}</span>

        <span
          v-if="dep.delayMinutes > 0"
          class="text-base font-mono shrink-0"
          :class="{
            'text-red-400': dep.delayMinutes >= 5,
            'text-amber-400': dep.delayMinutes < 5,
          }"
        >
          +{{ dep.delayMinutes }}'
        </span>

        <span class="text-3xl font-bold tabular-nums w-20 text-right shrink-0">
          {{ countdownLabel(dep.countdown) }}
        </span>
      </div>

      <div
        v-if="rows.length === 0 && !loading"
        class="flex-1 flex items-center justify-center text-neutral-500 text-xl"
      >
        Keine Abfahrten
      </div>
    </template>
  </div>
</template>
