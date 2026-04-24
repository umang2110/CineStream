export interface UserDB {
  email: string;
  name: string;
  password_hash: string;
  is_verified: boolean;
  verification_token?: string;
  token_expiry?: number;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabasePromise: Promise<typeof import("@supabase/supabase-js").SupabaseClient> | null = null;

async function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  }

  if (!supabasePromise) {
    supabasePromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
  }

  return supabasePromise;
}

type UserUpdate = Partial<Omit<UserDB, "email">>;

export async function getAllUsers(): Promise<UserDB[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("email,name,password_hash,is_verified,verification_token,token_expiry")
    .order("email", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data ?? [];
}

export async function findUserByEmail(email: string): Promise<UserDB | null> {
  const supabase = await getSupabaseClient();
  const normalizedEmail = email.toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select("email,name,password_hash,is_verified,verification_token,token_expiry")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }

  return data;
}

export async function createUser(user: UserDB): Promise<void> {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("users").insert({
    email: user.email.toLowerCase(),
    name: user.name,
    password_hash: user.password_hash,
    is_verified: user.is_verified,
    verification_token: user.verification_token ?? null,
    token_expiry: user.token_expiry ?? null,
  });

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

export async function updateUser(email: string, updates: UserUpdate): Promise<void> {
  const supabase = await getSupabaseClient();
  const normalizedEmail = email.toLowerCase();

  const payload: Record<string, string | number | boolean | null> = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.password_hash !== undefined) payload.password_hash = updates.password_hash;
  if (updates.is_verified !== undefined) payload.is_verified = updates.is_verified;
  if (updates.verification_token !== undefined) payload.verification_token = updates.verification_token ?? null;
  if (updates.token_expiry !== undefined) payload.token_expiry = updates.token_expiry ?? null;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from("users").update(payload).eq("email", normalizedEmail);

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}
