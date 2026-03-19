'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { GalleryVerticalEndIcon } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white text-zinc-950">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Depad</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-white text-2xl font-semibold tracking-tight mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-zinc-400 text-sm">
              Entre com sua conta corporativa Microsoft
            </p>
          </div>

          <button
            onClick={() => signIn("microsoft-entra-id", { redirectTo: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-sm py-3 px-4 rounded-xl transition-colors duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Continuar com Microsoft
          </button>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Acesso restrito a colaboradores autorizados
        </p>
      </div>
    </div>
  );
}