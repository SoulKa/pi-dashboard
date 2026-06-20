import { onMounted, onUnmounted, ref } from "vue";
import type { Ref } from "vue";
import config from "@/config";

export interface Departure {
  line: string;
  direction: string;
  scheduledTime: Date;
  realtimeTime: Date | null;
  delayMinutes: number;
  platform: string | null;
  countdown: number;
}

interface VvsDateTime {
  date: string;
  time: string;
}

interface VvsDeparture {
  dateTime: VvsDateTime;
  realDateTime?: VvsDateTime;
  countdown: string;
  servingLine: { number: string; direction: string };
  platform?: string;
}

interface VvsResponse {
  departureList?: VvsDeparture[];
}

const POLL_INTERVAL_MS = 60 * 1000;

function parseVvsDate(date: string, time: string): Date {
  const [d, m, y] = date.split(".");
  const [h, min] = time.split(":");
  return new Date(+y, +m - 1, +d, +h, +min);
}

export function useTrains(): {
  departures: Ref<Departure[]>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
} {
  const departures = ref<Departure[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams({
        outputFormat: "rapidJSON",
        type_dm: "stopID",
        name_dm: config.station.id.toString(),
        mode: "direct",
        dmLineSelectionAll: "1",
        limit: "20",
        useRealtime: "1",
      });
      const response = await fetch(`/api/vvs/XML_DM_REQUEST?${params}`);
      if (!response.ok) throw new Error(`VVS API error: ${response.status}`);
      const data = (await response.json()) as VvsResponse;
      departures.value = (data.departureList ?? []).map((d) => {
        const scheduled = parseVvsDate(d.dateTime.date, d.dateTime.time);
        const realtime = d.realDateTime
          ? parseVvsDate(d.realDateTime.date, d.realDateTime.time)
          : null;
        const delayMinutes = realtime
          ? Math.round((realtime.getTime() - scheduled.getTime()) / 60000)
          : 0;
        return {
          line: d.servingLine.number,
          direction: d.servingLine.direction,
          scheduledTime: scheduled,
          realtimeTime: realtime,
          delayMinutes,
          platform: d.platform ?? null,
          countdown: parseInt(d.countdown, 10),
        };
      });
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      loading.value = false;
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    void refresh();
    timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
  });

  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  });

  return { departures, loading, error, refresh };
}
