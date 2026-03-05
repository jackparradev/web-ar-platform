import { getCardDataBySlug } from '@/infra/actions/card.actions'
import ARCardDynamic from '@/ui/components/features/ar/ARCardDynamic'

export default async function CardPage(
  { params }: { params: Promise<{ slug: string }> }
) {

  const { slug } = await params

  // 1. Fetch data from infra action
  const result = await getCardDataBySlug(slug)

  // 2. Handle specific action errors
  if (!result.success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error cargando tarjeta</h1>
          <p className="text-gray-400">{result.error}</p>
        </div>
      </div>
    )
  }

  // 3. Return the dynamic AR element
  // FIX #3: Sin overflow-hidden ni bg-black — a-scene (position:fixed) cubre
  // el viewport por su cuenta. overflow-hidden recortaba el canvas y bg-black
  // pintaba una capa negra encima del feed de cámara.
  return (
    <main className="relative w-full h-screen">
      <ARCardDynamic data={result.data} />
    </main>
  )
}