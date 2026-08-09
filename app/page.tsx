import type { Metadata } from "next";

import { LoginScreen } from "@/components/auth/login-screen";

export const metadata: Metadata = { title: "Entrar" };

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ next?: string; status?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return <LoginScreen next={params.next} status={params.status} />;
}
