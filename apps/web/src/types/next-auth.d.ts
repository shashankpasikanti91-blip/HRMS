import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** FastAPI access token — use this for all API calls */
    access_token?: string;
    /** FastAPI refresh token */
    refresh_token?: string;
    /** Backend user object from FastAPI */
    backend_user?: {
      id: string;
      business_id: string;
      email: string;
      full_name: string;
      role: string;
      status: string;
      company_id?: string;
      avatar_url?: string;
      provider?: string;
      product_access?: string[];
    };
  }

  interface User {
    access_token?: string;
    refresh_token?: string;
    backend_user?: Session["backend_user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    backend_user?: import("next-auth").Session["backend_user"];
  }
}
