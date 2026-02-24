import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { R2Service } from '@/lib/r2';
import { files } from '@/db/schema';
import { eq } from 'drizzle-orm';


/**
 * Serve R2 files as downloads with proper Content-Disposition.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const identity = cookieStore.get('active_identity')?.value;
    if (!identity) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    const db = getDb();
    const [fileRecord] = await db
        .select()
        .from(files)
        .where(eq(files.id, id))
        .limit(1);

    if (!fileRecord) {
        return new Response('Object Not Found', { status: 404 });
    }

    const object = await R2Service.get(id);
    if (!object) {
        return new Response('R2 Object Not Found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', fileRecord.mimeType);
    headers.set('Content-Length', String(fileRecord.sizeBytes));
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRecord.name)}"`);
    headers.set('Cache-Control', 'private, no-cache');

    return new Response(object.body as any, {
        status: 200,
        headers,
    });
}
