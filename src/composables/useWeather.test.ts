import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { fetchWeatherApi } from "openmeteo";
import { useWeather } from "./useWeather";

vi.mock("openmeteo", () => ({ fetchWeatherApi: vi.fn() }));
vi.mock("@/config", () => ({
  default: { location: { latitude: 1.0, longitude: 2.0 }, station: { id: 123 } },
}));

type MountReturn = ReturnType<typeof mount>;

function withSetup<T>(composable: () => T): [T, MountReturn] {
  let result!: T;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable();
        return () => null;
      },
    }),
  );
  return [result, wrapper];
}

const VARIABLE_VALUES = [20.5, 18.0, 3, 15.0, 0.2];

const DAILY_VALUES: number[][] = [
  [3, 61],      // weather_code:                  today=3,    tomorrow=61
  [25.0, 18.0], // temperature_2m_max:             today=25,   tomorrow=18
  [15.0, 10.0], // temperature_2m_min:             today=15,   tomorrow=10
  [0.0, 8.5],   // precipitation_sum:              today=0,    tomorrow=8.5
  [5, 80],      // precipitation_probability_max:  today=5,    tomorrow=80
];

const MOCK_RESPONSE = [
  {
    utcOffsetSeconds: () => 0,
    current: () => ({
      time: () => 1000,
      variables: (i: number) => ({ value: () => VARIABLE_VALUES[i] ?? 0 }),
    }),
    daily: () => ({
      variables: (i: number) => ({ valuesArray: () => DAILY_VALUES[i] }),
    }),
  },
];

describe("useWeather", () => {
  beforeEach(() => {
    vi.mocked(fetchWeatherApi).mockResolvedValue(MOCK_RESPONSE as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts loading and fires an initial fetch on mount", async () => {
    const [result, wrapper] = withSetup(() => useWeather());
    expect(result.loading.value).toBe(true);
    await flushPromises();
    expect(result.loading.value).toBe(false);
    expect(vi.mocked(fetchWeatherApi)).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("calls fetchWeatherApi with the configured lat/lon", async () => {
    const [, wrapper] = withSetup(() => useWeather());
    await flushPromises();
    expect(vi.mocked(fetchWeatherApi)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ latitude: 1.0, longitude: 2.0 }),
    );
    wrapper.unmount();
  });

  it("populates weather with correctly mapped fields", async () => {
    const [result, wrapper] = withSetup(() => useWeather());
    await flushPromises();

    expect(result.weather.value).not.toBeNull();
    const w = result.weather.value!;
    expect(w.temperature).toBe(20.5);
    expect(w.apparentTemperature).toBe(18.0);
    expect(w.weatherCode).toBe(3);
    expect(w.windSpeed).toBe(15.0);
    expect(w.precipitation).toBe(0.2);
    expect(w.time).toEqual(new Date(1000 * 1000));
    wrapper.unmount();
  });

  it("populates tomorrow forecast from daily data", async () => {
    const [result, wrapper] = withSetup(() => useWeather());
    await flushPromises();

    const t = result.weather.value!.tomorrow;
    expect(t.weatherCode).toBe(61);
    expect(t.high).toBe(18);
    expect(t.low).toBe(10);
    expect(t.precipitationMm).toBe(8.5);
    expect(t.precipitationProbability).toBe(80);
    wrapper.unmount();
  });

  it("sets error and keeps weather null when the fetch rejects", async () => {
    vi.mocked(fetchWeatherApi).mockRejectedValue(new Error("network error"));
    const [result, wrapper] = withSetup(() => useWeather());
    await flushPromises();

    expect(result.error.value).toBeInstanceOf(Error);
    expect(result.weather.value).toBeNull();
    wrapper.unmount();
  });

  it("re-fetches after 30 minutes", async () => {
    vi.useFakeTimers();
    const [, wrapper] = withSetup(() => useWeather());
    await flushPromises();
    expect(vi.mocked(fetchWeatherApi)).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

    expect(vi.mocked(fetchWeatherApi)).toHaveBeenCalledTimes(2);
    wrapper.unmount();
    vi.useRealTimers();
  });

  it("stops polling after unmount", async () => {
    vi.useFakeTimers();
    const [, wrapper] = withSetup(() => useWeather());
    await flushPromises();

    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

    expect(vi.mocked(fetchWeatherApi)).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
