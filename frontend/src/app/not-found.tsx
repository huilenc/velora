import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400 text-6xl font-bold">404</p>
      <p className="text-gray-500">Página no encontrada</p>
      <Link href="/" className="text-green-400 hover:underline">
        Ir al inicio →
      </Link>
    </main>
  );
}
