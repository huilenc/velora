export default function PayPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">

        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm font-mono">velora.xyz/pay/{params.id}</p>
          <h1 className="text-4xl font-bold">Pago solicitado</h1>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Para</span>
            <span className="font-mono text-sm">gloria.sol</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Monto</span>
            <span className="text-3xl font-bold text-green-400">$200 USDC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Recibe en</span>
            <span className="text-sm">Solana</span>
          </div>
          <div className="border-t border-gray-800 pt-4">
            <p className="text-gray-500 text-sm text-center">
              Pagá desde cualquier chain — ETH, Arbitrum, Base, Polygon
            </p>
          </div>
        </div>

        <button className="w-full bg-green-400 text-black font-bold py-4 rounded-xl text-lg hover:bg-green-300 transition-colors">
          Conectar wallet y pagar
        </button>

        <p className="text-center text-gray-600 text-xs">
          Powered by LI.FI · Liquidación en Solana · &lt;1 segundo
        </p>

      </div>
    </main>
  );
}