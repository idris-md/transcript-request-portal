// app/api/auth/[...nextauth]/route.ts
import {  handlers } from "@/lib/auth";
// Expose Auth.js handlers to Next.js App Router
export const { GET, POST } = handlers;
