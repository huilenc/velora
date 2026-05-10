export default function Dashboard() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold">Mi dashboard</h1>
          <p className="text-gray-400 mt-1">Creá y gestioná tus links de pago</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Crear nuevo link de pago</h2>
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm">Monto en USDC</label>
              <input
                type="number"
                placeholder="200"
                className="w-full mt-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Descripción (opcional)</label>
              <input
                type="text"
                placeholder="Diseño de logo"
                className="w-full mt-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <button className="w-full bg-green-400 text-black font-bold py-3 rounded-xl hover:bg-green-300 transition-colors">
              Generar link
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold">Links recientes</h2>
          {[
            { id: "abc123", monto: 200, desc: "Diseño de logo", estado: "pagado" },
            { id: "xyz789", monto: 500, desc: "Website completo", estado: "pendiente" },
            { id: "qwe456", monto: 50, desc: "Banner redes", estado: "pendiente" },
          ].map((link) => (
            <div key={link.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-gray-400">velora.xyz/pay/{link.id}</p>
                <p className="font-medium">{link.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">${link.monto} USDC</p>
                <span className={`text-xs px-2 py-1 rounded-full ${link.estado === "pagado" ? "bg-green-400/10 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                  {link.estado}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}