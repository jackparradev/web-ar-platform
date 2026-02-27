'use server';

import { createClient } from '@supabase/supabase-js';
import { ARViewerData, ActionResult } from '@/domain/types/card.types';

// Initialize Supabase with Service Role to bypass RLS for public cards reading
// This ensures we get the needed data securely.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// We use the admin client here to bypass RLS since AR viewers don't need to be authenticated users
// Note: Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your enviroment
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getCardDataBySlug(slug: string): Promise<ActionResult<ARViewerData>> {
    try {
        // 1. Fetch the Card details
        // Only fetch if published is true to prevent leaking draft cards
        const { data: card, error: cardError } = await supabaseAdmin
            .from('cards')
            .select('*')
            .eq('slug', slug)
            .eq('published', true)
            .maybeSingle();

        if (cardError) {
            console.error('getCardDataBySlug - Database error fetching card:', cardError);
            return { success: false, error: 'Database error fetching card' };
        }

        if (!card) {
            return { success: false, error: 'Card not found or un-published' };
        }

        if (!card.user_id) {
            return { success: false, error: 'Invalid card configuration: Missing User ID' };
        }

        // 2. Fetch the corresponding Profile
        // NOTE: We do a secondary query instead of a direct JOIN (.select('*, profiles(*)')) because 
        // the current Supabase SQL schema enforces foreign keys strictly on `auth.users(id)` and not between points 
        // of `cards.user_id` to `profiles.id` directly. 
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', card.user_id)
            .maybeSingle();

        if (profileError) {
            console.error('getCardDataBySlug - Database error fetching profile:', profileError);
            return { success: false, error: 'Database error fetching profile' };
        }

        if (!profile) {
            return { success: false, error: 'Associated profile not found' };
        }

        // 3. Generate Signed URL for the Mind File (120s TTL)
        const { data: signedData, error: signedError } = await supabaseAdmin
            .storage
            .from('mind-files')
            // FIX #5: TTL aumentado a 3600s (1h) para evitar que el fetch de MindAR
            // falle con 403 Forbidden en conexiones lentas o cuando el usuario
            // tarda en abrir la URL.
            .createSignedUrl(card.mind_file_path, 3600);

        if (signedError || !signedData?.signedUrl) {
            console.error('getCardDataBySlug - Signed URL error:', signedError);
            return { success: false, error: 'Could not generate secure AR file link' };
        }

        // Return the successful AR Data consolidation
        return {
            success: true,
            data: {
                card,
                profile,
                mindUrl: signedData.signedUrl
            }
        };
    } catch (err: unknown) {
        console.error('getCardDataBySlug - Exception:', err);
        return { success: false, error: 'Internal server exception fetching AR content' };
    }
}
