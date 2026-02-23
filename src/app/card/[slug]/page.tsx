import { supabaseAdmin } from '@/lib/supabase/server'
import ARCard from './ARCard'

export default async function CardPage(
  { params }: { params: Promise<{ slug: string }> }
) {

  const { slug } = await params

  const { data: card, error: cardError } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!card || cardError) {
    return <div>Tarjeta no encontrada</div>
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', card.user_id)
    .single()

  if (!profile || profileError) {
    return <div>Perfil no encontrado</div>
  }

  const { data: signedData } = await supabaseAdmin.storage
    .from('mind-files')
    .createSignedUrl(card.mind_file_path, 120)

  return (
    <ARCard
      card={card}
      profile={profile}
      mindFileUrl={signedData?.signedUrl ?? ''}
    />
  )
}