import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/server'
import ARCard from './ARCard'

type PageProps = {
  params: { slug: string }
}

export default async function CardPage({ params }: PageProps) {
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('*, profiles(*)')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (error || !card) {
    console.error('Card fetch error:', error)
    return notFound()
  }

  const { data: signedData, error: signedError } =
    await supabaseAdmin.storage
      .from('mind-files')
      .createSignedUrl(card.mind_file_path, 120)

  if (signedError || !signedData?.signedUrl) {
    console.error('Signed URL error:', signedError)
    return <div>Error cargando archivo AR</div>
  }

  return (
    <ARCard
      card={card}
      profile={card.profiles}
      mindFileUrl={signedData.signedUrl}
    />
  )
}