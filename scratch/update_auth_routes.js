const fs = require('fs');

// 1. Update src/lib/auth/session.ts
let sessionContent = fs.readFileSync('src/lib/auth/session.ts', 'utf8');
if (!sessionContent.includes('extractSessionToken')) {
  sessionContent += `
/**
 * Extracts session token safely from either the Request headers (cookie or Authorization)
 * or via Next.js cookies(), without crashing if cookies() is called outside request scope.
 */
export async function extractSessionToken(request?: Request): Promise<string | null> {
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\\s+/i, "").trim();
      if (token) return token;
    }
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp('(?:^|;\\\\s*)' + SESSION_COOKIE_NAME + '=([^;]+)'));
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}
`;
  fs.writeFileSync('src/lib/auth/session.ts', sessionContent, 'utf8');
  console.log('Updated src/lib/auth/session.ts');
}

// 2. Update src/app/api/auth/login/route.ts
let loginRoute = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');
loginRoute = loginRoute.replace(
  `    const isClientError =
      error.message?.includes("No account found") ||
      error.message?.includes("Invalid password") ||
      error.message?.includes("disabled") ||
      error.message?.includes("portal") ||
      error.message?.includes("account");
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: isClientError ? 401 : 500 }
    );`,
  `    const isClientError =
      !error.message ||
      error.message.includes("No account") ||
      error.message.includes("password") ||
      error.message.includes("disabled") ||
      error.message.includes("portal") ||
      error.message.includes("Teacher") ||
      error.message.includes("staff") ||
      error.message.includes("Parent") ||
      error.message.includes("role") ||
      error.message.includes("account");
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: isClientError ? 401 : 500 }
    );`
);
fs.writeFileSync('src/app/api/auth/login/route.ts', loginRoute, 'utf8');
console.log('Updated src/app/api/auth/login/route.ts');

// 3. Update src/app/api/parent/students/[id]/route.ts
let studentRoute = fs.readFileSync('src/app/api/parent/students/[id]/route.ts', 'utf8');
studentRoute = studentRoute.replace(
  `import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";`,
  `import { verifySession, extractSessionToken } from "@/lib/auth/session";`
);
studentRoute = studentRoute.replace(
  `    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;`,
  `    const sessionToken = await extractSessionToken(request);`
);
fs.writeFileSync('src/app/api/parent/students/[id]/route.ts', studentRoute, 'utf8');
console.log('Updated src/app/api/parent/students/[id]/route.ts');

// 4. Update src/app/api/parent/me/route.ts
let meRoute = fs.readFileSync('src/app/api/parent/me/route.ts', 'utf8');
meRoute = meRoute.replace(
  `import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";`,
  `import { verifySession, extractSessionToken } from "@/lib/auth/session";`
);
meRoute = meRoute.replace(
  `export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;`,
  `export async function GET(request?: Request) {
  try {
    const sessionToken = await extractSessionToken(request);`
);
fs.writeFileSync('src/app/api/parent/me/route.ts', meRoute, 'utf8');
console.log('Updated src/app/api/parent/me/route.ts');

// 5. Update src/app/api/parent/link-code/route.ts
let linkRoute = fs.readFileSync('src/app/api/parent/link-code/route.ts', 'utf8');
linkRoute = linkRoute.replace(
  `import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";`,
  `import { verifySession, extractSessionToken } from "@/lib/auth/session";`
);
linkRoute = linkRoute.replace(
  `    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;`,
  `    const sessionToken = await extractSessionToken(request);`
);
fs.writeFileSync('src/app/api/parent/link-code/route.ts', linkRoute, 'utf8');
console.log('Updated src/app/api/parent/link-code/route.ts');

// 6. Update src/app/api/parent/messages/route.ts
let msgRoute = fs.readFileSync('src/app/api/parent/messages/route.ts', 'utf8');
msgRoute = msgRoute.replace(
  `import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";`,
  `import { verifySession, extractSessionToken } from "@/lib/auth/session";`
);
msgRoute = msgRoute.replaceAll(
  `    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;`,
  `    const sessionToken = await extractSessionToken(request);`
);
fs.writeFileSync('src/app/api/parent/messages/route.ts', msgRoute, 'utf8');
console.log('Updated src/app/api/parent/messages/route.ts');

// 7. Update src/app/api/parent/students/route.ts
let studentsRoute = fs.readFileSync('src/app/api/parent/students/route.ts', 'utf8');
studentsRoute = studentsRoute.replace(
  `import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";`,
  `import { verifySession, extractSessionToken } from "@/lib/auth/session";`
);
studentsRoute = studentsRoute.replace(
  `export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;`,
  `export async function GET(request?: Request) {
  try {
    const sessionToken = await extractSessionToken(request);`
);
fs.writeFileSync('src/app/api/parent/students/route.ts', studentsRoute, 'utf8');
console.log('Updated src/app/api/parent/students/route.ts');

// Update src/app/api/v1/auth/login/route.ts
let v1Login = fs.readFileSync('src/app/api/v1/auth/login/route.ts', 'utf8');
v1Login = v1Login.replace(
  'error.message?.includes("disabled");',
  'error.message?.includes("disabled") || error.message?.includes("portal") || error.message?.includes("staff") || error.message?.includes("Parent") || error.message?.includes("Teacher");'
);
fs.writeFileSync('src/app/api/v1/auth/login/route.ts', v1Login, 'utf8');
console.log('Updated src/app/api/v1/auth/login/route.ts');
