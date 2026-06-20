import config from "@/../dashboard.config.json";

interface LocationConfig {
  latitude: number;
  longitude: number;
}

interface DashboardConfig {
  location: LocationConfig;
}

export default config as DashboardConfig;
