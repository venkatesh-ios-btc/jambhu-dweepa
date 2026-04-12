/** Quick check that Vercel is routing /api/* to Node (open /api/health on your deployed site). */
export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    where: 'vercel-serverless',
    backendUrlConfigured: Boolean(process.env.BACKEND_URL?.trim()),
  });
}
