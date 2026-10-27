/**
 * POST /.netlify/functions/publish-social
 *
 * Endpoint administrativo para despachar una campaña de vídeo o imagen publicitaria
 * a redes sociales mediante el webhook configurado en SOCIAL_WEBHOOK_URL.
 */
const socialPublisher = require('./_lib/social-publisher');

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  // GET: Muestra el estado del servicio y un payload de ejemplo
  if (event.httpMethod === 'GET') {
    const hasWebhook = Boolean(process.env.SOCIAL_WEBHOOK_URL && process.env.SOCIAL_WEBHOOK_URL.trim());
    return jsonResponse(200, {
      status: 'active',
      webhookConfigured: hasWebhook,
      targetPlatformsSupported: ['tiktok', 'instagram', 'pinterest', 'facebook', 'twitter', 'linkedin'],
      instructions: hasWebhook
        ? 'El webhook de redes sociales está configurado y listo para recibir campañas.'
        : 'Para automatizar la publicación, añade la variable SOCIAL_WEBHOOK_URL en Netlify con la URL de tu Make, Zapier, n8n o Metricool.',
      examplePayload: socialPublisher.buildSocialPayload({
        title: 'LUMIKO Panel LED Pixoo 👾',
        caption: 'Transforma tu setup con animaciones pixel art y luz neón interactiva.',
        videoUrl: 'https://phoenix-video-pub.oss-accelerate.aliyuncs.com/video/cgt-20261028013500-m5hkq.mp4',
        imageUrl: 'https://sc02.alicdn.com/kf/A0370a90c537c462da35aa3eff0bffb3b5.png',
        productRef: 'panel-pixoo-16',
        discountCode: 'LUMI10',
        platforms: ['tiktok', 'instagram', 'pinterest'],
        hashtags: ['#LUMIKO', '#SetupGamer', '#PixelArt', '#DecoracionAnime']
      })
    });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const campaignPayload = socialPublisher.buildSocialPayload(body);
    const result = await socialPublisher.dispatchToWebhook(campaignPayload, body.webhookUrlOverride);

    return jsonResponse(result.dispatched ? 200 : 202, {
      success: result.dispatched,
      result
    });
  } catch (err) {
    return jsonResponse(400, {
      error: 'invalid_request',
      message: err.message
    });
  }
};
