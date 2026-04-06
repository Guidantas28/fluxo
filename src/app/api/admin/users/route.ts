import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin" || !me.active) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    full_name?: string;
    role?: string;
  };

  const email = body.email?.trim();
  const password = body.password;
  const full_name = body.full_name?.trim() ?? "";
  const role = body.role === "admin" ? "admin" : "operator";

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "E-mail e senha (mín. 6 caracteres) são obrigatórios." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Servidor sem SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (error || !created.user) {
    return NextResponse.json({ error: error?.message ?? "Falha ao criar usuário" }, { status: 400 });
  }

  await admin
    .from("profiles")
    .update({ full_name, role })
    .eq("id", created.user.id);

  return NextResponse.json({ id: created.user.id, email: created.user.email });
}
