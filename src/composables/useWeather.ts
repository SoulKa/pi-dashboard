import { onMounted, onUnmounted, ref } from "vue";
import type { Ref } from "vue";
import { fetchWeatherApi } from "openmeteo";
import config from "@/config";

export interface WeatherData {
  time: Date;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
}

const POLL_INTERVAL_MS = 30 * 60 * 1000;

export function useWeather(): {
  weather: Ref<WeatherData | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
} {
  const weather = ref<WeatherData | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const responses = await fetchWeatherApi(
        "https://api.open-meteo.com/v1/forecast",
        {
          latitude: config.location.latitude,
          longitude: config.location.longitude,
          current: [
            "temperature_2m",
            "apparent_temperature",
            "weathercode",
            "windspeed_10m",
            "precipitation",
          ],
          timezone: "auto",
        },
      );
      const location = responses[0];
      const utcOffsetSeconds = location.utcOffsetSeconds();
      const current = location.current()!;
      weather.value = {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature: current.variables(0)!.value(),
        apparentTemperature: current.variables(1)!.value(),
        weatherCode: current.variables(2)!.value(),
        windSpeed: current.variables(3)!.value(),
        precipitation: current.variables(4)!.value(),
      };
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

  return { weather, loading, error, refresh };
}
