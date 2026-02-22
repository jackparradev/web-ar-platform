import { supabaseAdmin } from '@/lib/supabase/server'
import ARCard from './ARCard'

export default async function CardPage({ params }: { params: { slug: string } }) {
  const { data: card } = await supabaseAdmin
    .from('cards')
    .select('*, profiles(*)')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!card) return <div>Tarjeta no encontrada</div>

  // Obtener signed URL del .mind file
  const { data: signedData } = await supabaseAdmin.storage
    .from('mind-files')
    .createSignedUrl(card.mind_file_path, 120)

  return (
    <ARCard
      card={card}
      profile={card.profiles}
      mindFileUrl={signedData?.signedUrl ?? ''}
    />
  )
}