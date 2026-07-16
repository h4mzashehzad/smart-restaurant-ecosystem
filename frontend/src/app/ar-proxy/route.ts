import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOST_SUFFIXES = [
  '.amazonaws.com',
  '.cloudfront.net',
  'modelviewer.dev',
];

function isAllowedModelUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;

    const path = url.pathname.toLowerCase();
    if (!path.endsWith('.glb') && !path.endsWith('.gltf')) return null;

    const host = url.hostname.toLowerCase();
    const allowed = ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(suffix)
    );
    return allowed ? url : null;
  } catch {
    return null;
  }
}

function contentTypeFor(url: URL, upstream: string | null): string {
  if (upstream && upstream !== 'application/x-www-form-urlencoded' && upstream !== 'application/octet-stream') {
    return upstream;
  }
  return url.pathname.toLowerCase().endsWith('.gltf')
    ? 'model/gltf+json'
    : 'model/gltf-binary';
}

/**
 * Same-origin proxy for AR GLB/GLTF assets.
 * Avoids browser CORS failures against S3 while keeping a public HTTPS URL
 * for model-viewer / Quick Look / Scene Viewer.
 *
 * GET /ar-proxy?url=https://bucket.s3.region.amazonaws.com/path/model.glb
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 });
  }

  const target = isAllowedModelUrl(rawUrl);
  if (!target) {
    return NextResponse.json(
      { error: 'URL must be https and point to an allowed .glb/.gltf host' },
      { status: 400 }
    );
  }

  const headers = new Headers();
  const range = request.headers.get('range');
  if (range) headers.set('Range', range);

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers,
      redirect: 'follow',
      cache: 'force-cache',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch model from storage' }, { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', contentTypeFor(target, upstream.headers.get('Content-Type')));
  responseHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag');

  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength) responseHeaders.set('Content-Length', contentLength);

  const contentRange = upstream.headers.get('Content-Range');
  if (contentRange) responseHeaders.set('Content-Range', contentRange);

  const acceptRanges = upstream.headers.get('Accept-Ranges');
  if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges);

  const etag = upstream.headers.get('ETag');
  if (etag) responseHeaders.set('ETag', etag);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function HEAD(request: NextRequest) {
  const response = await GET(request);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
