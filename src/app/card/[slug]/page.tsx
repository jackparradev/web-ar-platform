import { getCardBySlugAction } from '@/infra/actions/card.actions'
import dynamic from 'next/dynamic'

const ARCardWrapperDynamic = dynamic(
  () => import('@/ui/components/features/ar/ARCardWrapper'),
  { ssr: false }
)

export default async function CardPage(
  { params }: { params: Promise<{ slug: string }> }
) {

  const { slug } = await params

  // 1. Fetch data from infra action
  const result = await getCardBySlugAction(slug)

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
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <ARCardWrapperDynamic card={result.data} />
    </main>
  )
}