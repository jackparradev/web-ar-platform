'use server';

import { Card } from '@/domain/types/card.types';
// import { createClient } from '@/infra/db/supabase/server'; // Ready for real implementation

export type ActionResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Fetches Card, Profile and links by Slug.
 * Implements the Result Object pattern for safe explicit error handling on the client.
 */
export async function getCardBySlugAction(slug: string): Promise<ActionResponse<Card>> {
    try {
        // 1. Instanciar Supabase client cuando el proyecto esté conectado:
        // const supabase = await createClient();

        // 2. Ejecutar la query a Supabase:
        // const { data, error } = await supabase
        //   .from('cards')
        //   .select('*, profile:profiles(*)')
        //   .eq('slug', slug)
        //   .eq('is_active', true)
        //   .single();

        // if (error) throw new Error(error.message);
        // if (!data) throw new Error('Card not found');

        // 3. Crear Signed URL si el target .mind es privado:
        // const { data: signedData } = await supabase.storage
        //   .from('targets')
        //   .createSignedUrl(data.mind_file_path, 60);

        // MOCK DATA: Simulación basada en el MVP proporcionado
        const mockData: Card = {
            id: 'mock-123',
            slug,
            tenantId: 'tenant-demo',
            isActive: true,
            mindFileUrl: './assets/targets/cardtest.mind', // Mock URL
            profile: {
                id: 'prof-123',
                firstName: 'Jack Stalin',
                lastName: 'Parra',
                jobTitle: 'Full Stack Developer',
                avatarUrl: './assets/ui/Perfil.png'
            },
            companyLogoUrl: './assets/ui/dev26.png',
            socialLinks: {
                github: 'https://github.com/jackparradev',
                linkedin: 'https://www.linkedin.com/in/jackparradev/',
                phone: 'https://wa.me/51950886127'
            }
        };

        return {
            success: true,
            data: mockData
        };

    } catch (error) {
        console.error(`[getCardBySlugAction] Error fetching card '${slug}':`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown server error'
        };
    }
}
