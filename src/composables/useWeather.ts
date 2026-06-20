import { onMounted, onUnmounted, ref } from "vue";
import type { Ref } from "vue";
import { fetchWeatherApi } from "openmeteo";
import config from "@/config";

export interface TomorrowForecast {
  high: number;
  low: number;
  weatherCode: number;
  precipitationMm: number;
  precipitationProbability: number;
}

export interface WeatherData {
  time: Date;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  tomorrow: TomorrowForecast;
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
          daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
          ],
          timezone: "auto",
        },
      );
      const location = responses[0];
      const utcOffsetSeconds = location.utcOffsetSeconds();
      const current = location.current()!;
      const daily = location.daily()!;
      const d = (i: number) => daily.variables(i)!.valuesArray()![1]!;
      weather.value = {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature: current.variables(0)!.value(),
        apparentTemperature: current.variables(1)!.value(),
        weatherCode: current.variables(2)!.value(),
        windSpeed: current.variables(3)!.value(),
        precipitation: current.variables(4)!.value(),
        tomorrow: {
          weatherCode: Math.round(d(0)),
          high: Math.round(d(1)),
          low: Math.round(d(2)),
          precipitationMm: Math.round(d(3) * 10) / 10,
          precipitationProbability: Math.round(d(4)),
        },
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
