// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { transcriptPool } from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        matric: { label: "Matric No", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.matric || !creds?.password) return null;

        const [rows] = await transcriptPool.query(
          "SELECT id, matric_no, password_hash, full_name FROM students WHERE matric_no=? LIMIT 1",
          [creds.matric]
        );
        const user = (rows as any[])[0];
        if (!user) return null;

        const ok = await bcrypt.compare(
          creds.password as string,
          user.password_hash
        );
        if (!ok) return null;

        return {
          id: String(user.id),
          name: user.full_name,
          matric: user.matric_no,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.matric = (user as any).matric;
      return token;
    },
    async session({ session, token }) {
      (session as any).matric = token.matric;
      return session;
    },
  },
});
