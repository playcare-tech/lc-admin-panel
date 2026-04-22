export async function onRequest(context) {
    const { request, env } = context;
    if (request.method === 'POST') {
        const { action, details } = await request.json();
        const timestamp = new Date().toISOString();
        await env.DB.prepare('INSERT INTO logs (timestamp, action, details) VALUES (?, ?, ?)').bind(timestamp, action, details).run();
        return new Response('Logged', { status: 200 });
    } else if (request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
        return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Method not allowed', { status: 405 });
}