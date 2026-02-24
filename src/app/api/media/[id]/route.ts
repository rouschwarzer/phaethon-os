import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { R2Service } from '@/lib/r2';
import { files } from '@/db/schema';
import { eq } from 'drizzle-orm';


/**
 * Stream R2 objects securely via session-validated requests.
 * Supports HTTP Range headers for video seeking.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Auth check
    const cookieStore = await cookies();
    const identity = cookieStore.get('active_identity')?.value;
    if (!identity) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { id } = await params;

        // 2. Verify file exists
        const db = getDb();
        const [fileRecord] = await db
            .select()
            .from(files)
            .where(eq(files.id, id))
            .limit(1);

        if (!fileRecord) {
            console.error(`[Media API] File record not found for ID: ${id}`);
            return new Response('Object Not Found', { status: 404 });
        }

        // 3. Fetch from R2
        const rangeHeader = request.headers.get('Range');
        const object = await R2Service.get(id, rangeHeader || undefined);

        if (!object) {
            console.error(`[Media API] R2 object not found for ID: ${id}`);
            return new Response('R2 Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', fileRecord.mimeType);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'private, max-age=3600');
        headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileRecord.name)}"`);

        // Handle Range response
        if (rangeHeader && object.contentRange) {
            headers.set('Content-Range', object.contentRange);
            headers.set('Content-Length', String(object.size));

            return new Response(object.body as any, {
                status: 206,
                headers,
            });
        }

        headers.set('Content-Length', String(fileRecord.sizeBytes));
        return new Response(object.body as any, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('[Media API Error]:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
