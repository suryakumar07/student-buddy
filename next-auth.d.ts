// next-auth.d.ts

import { DefaultSession } from "next-auth";

// This is the key piece of code for TypeScript module augmentation
declare module "next-auth" {
  /**
   * We are extending the built-in Session interface.
   * Now, whenever we access `session.user`, TypeScript will know it has an `id` property.
   */
  interface Session {
    user: {
      /** The user's unique ID from the database. */
      id: string;
    } & DefaultSession["user"]; // This includes the default properties (name, email, image)
  }
}