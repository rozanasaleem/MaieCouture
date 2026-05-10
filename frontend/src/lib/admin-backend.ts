import "server-only";

const ADMIN_API_BASE =
  process.env.ADMIN_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api/v1";

const ADMIN_API_USERNAME =
  process.env.ADMIN_API_USERNAME ?? "admin@maiecouture.com";
const ADMIN_API_PASSWORD =
  process.env.ADMIN_API_PASSWORD ?? "ChangeMe123!";

function adminAuthHeader() {
  const token = Buffer.from(
    `${ADMIN_API_USERNAME}:${ADMIN_API_PASSWORD}`,
    "utf-8",
  ).toString("base64");
  return `Basic ${token}`;
}

export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: adminAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Admin API request failed (${response.status}): ${body.slice(0, 240)}`,
    );
  }

  if (response.status === 204) {
    return null as T;
  }
  return (await response.json()) as T;
}

