import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import { loginSchema } from "@/validations/auth.validation";
import User from "@/models/User";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  /*
    This configuration does not use a database adapter.
    Credentials login uses JWT-based sessions.
  */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /*
    Custom login page.
    Auth.js can redirect unauthenticated users here.
  */
  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "Email and Password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        /*
          Step 1:
          Login data to Zod from validate please.
        */
        const validationResult = loginSchema.safeParse(credentials);

        if (!validationResult.success) {
          return null;
        }

        const { email, password } = validationResult.data;

        /*
          Step 2:
          MongoDB connection establish please.
        */
        await connectDB();

        /*
          The password field uses select:false,
          therefore login of waqt explicitly +password use must be added.
        */
        const user = await User.findOne({
          email,
        }).select("+password");

        /*
          Security for invalid email and invalid password
          dono cases in same result return are using.
        */
        if (!user) {
          return null;
        }

        /*
          Disabled account to login allow will not.
        */
        if (!user.isActive) {
          return null;
        }

        /*
          Entered password to stored password hash from compare please.
        */
        const passwordMatches = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordMatches) {
          return null;
        }

        /*
          Successful login of timestamp update please.
          Password response in return not will be.
        */
        await User.updateOne(
          {
            _id: user._id,
          },
          {
            $set: {
              lastLoginAt: new Date(),
            },
          }
        );

        /*
          This object is passed to the JWT callback.
          only required safe fields return please.
        */
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.profileImage || null,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],

  callbacks: {
    /*
      Login of waqt authorize() from returned user data
      JWT token in save perform.
    */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
      }

      return token;
    },

    /*
      JWT token of required data frontend/server session
      in expose perform.
    */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }

      return session;
    },

    /*
      Proxy through route protection of kaam aayega.
      Detailed role checks are performed in proxy.js.
    */
    authorized({ auth: session }) {
      return Boolean(session?.user);
    },
  },

  /*
    Allow Auth.js to trust request hosts in development and deployment.
    
  */
  trustHost: true,

  /*
    Development in useful Auth.js logs.
    Production in false rahega.
  */
  debug: process.env.NODE_ENV === "development",
});
