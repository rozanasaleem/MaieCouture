import { NextRequest, NextResponse } from "next/server";

const ADMIN_USER =
  process.env.ADMIN_PANEL_USERNAME ?? "admin@maiecouture.com";
const ADMIN_PASS =
  process.env.ADMIN_PANEL_PASSWORD ?? "ChangeMe123!";

function unauthorized() {
  return new NextResponse("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Maie Admin"',
    },
  });
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return unauthorized();
  }

  const raw = header.slice("Basic ".length);
  let decoded = "";
  try {
    decoded = atob(raw);
  } catch {
    return unauthorized();
  }

  const [username = "", password = ""] = decoded.split(":");
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

