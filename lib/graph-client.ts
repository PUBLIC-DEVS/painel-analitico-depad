import axios from "axios";

export function createGraphClient(accessToken: string) {
  return axios.create({
    baseURL: "https://graph.microsoft.com/v1.0",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}