import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { path } = await req.json()
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.storage
    .from('mind-files')
    .createSignedUrl(path, 120) // 2 minutos es suficiente para que MindAR descargue el archivo

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}