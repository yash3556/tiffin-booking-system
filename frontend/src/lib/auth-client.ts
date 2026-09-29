import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const webMemoryStorage = new Map<string, string>();
const webStorage = {
  getItem(key: string) {
    return typeof localStorage === "undefined"
      ? (webMemoryStorage.get(key) ?? null)
      : localStorage.getItem(key);
  },
  getItemAsync(key: string) {
    return Promise.resolve(this.getItem(key));
  },
  setItem(key: string, value: string) {
    if (typeof localStorage === "undefined") {
      webMemoryStorage.set(key, value);
      return;
    }
    localStorage.setItem(key, value);
  },
  setItemAsync(key: string, value: string) {
    this.setItem(key, value);
    return Promise.resolve();
  },
};

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    expoClient({
      scheme: "frontend",
      storage: Platform.OS === "web" ? webStorage : SecureStore,
    }),
  ],
});

export async function authenticatedApiFetch(
  path: string,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers);

  if (Platform.OS !== "web") {
    const cookie = await authClient.getCookie();
    if (cookie) {
      headers.set("cookie", cookie);
    }
  }

  const url = `${apiBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });
}
