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

const MOCK_RESPONSE = [
  {
    utcOffsetSeconds: () => 0,
    current: () => ({
      time: () => 1000,
      variables: (i: number) => ({ value: () => VARIABLE_VALUES[i] ?? 0 }),
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
