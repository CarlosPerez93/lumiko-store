/**
 * Módulo de automatización y despacho de campañas a redes sociales.
 *
 * Envía el contenido publicitario (vídeo, imagen, copy, hashtags y enlaces)
 * hacia un webhook de automatización (Make.com, Zapier, n8n, Metricool o Buffer)
 * para publicar o programar automáticamente en TikTok, Instagram Reels, etc.
 */
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Prepara el payload estandarizado para las plataformas de redes sociales.
 */
function buildSocialPayload(campaign) {
  const now = new Date();
  const campaignId = campaign.id || `CMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const platforms = Array.isArray(campaign.platforms) && campaign.platforms.length > 0
    ? campaign.platforms
    : ['tiktok', 'instagram', 'pinterest'];

  const discountCode = campaign.discountCode || 'LUMI10';
  const targetUrl = campaign.targetUrl || 'https://lumiko-store.netlify.app/';

  const fullCaption = `${campaign.title ? campaign.title + '\n\n' : ''}${campaign.caption || ''}\n\n🏷️ Cupón: ${discountCode} (-10%)\n👉 ${targetUrl}\n\n${(campaign.hashtags || []).join(' ')}`.trim();

  return {
    campaignId,
    createdAt: now.toISOString(),
    status: 'ready_to_publish',
    targetPlatforms: platforms,
    schedule: {
      postImmediately: campaign.postImmediately !== false,
      scheduledTime: campaign.scheduledTime || now.toISOString()
    },
    media: {
      type: campaign.mediaType || (campaign.videoUrl ? 'video' : 'image'),
      videoUrl: campaign.videoUrl || null,
      imageUrl: campaign.imageUrl || null,
      aspectRatio: campaign.aspectRatio || '9:16',
      durationSeconds: campaign.durationSeconds || 10
    },
    copywriting: {
      hook: campaign.hook || '',
      caption: campaign.caption || '',
      discountCode,
      targetUrl,
      hashtags: campaign.hashtags || [],
      fullFormattedPost: fullCaption
    },
    metadata: {
      store: 'LUMIKO',
      productRef: campaign.productRef || null,
      source: 'lumiko-social-publisher'
    }
  };
}

/**
 * Envía la campaña al webhook configurado en SOCIAL_WEBHOOK_URL.
 */
function dispatchToWebhook(payload, webhookUrlOverride) {
  return new Promise((resolve) => {
    const webhookUrl = webhookUrlOverride || process.env.SOCIAL_WEBHOOK_URL;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.trim()) {
      console.log('[lumiko-social] Campaña preparada lista para despacho (sin SOCIAL_WEBHOOK_URL configurada):', JSON.stringify(payload, null, 2));
      return resolve({
        dispatched: false,
        reason: 'no_social_webhook_configured',
        instructions: 'Configura la variable de entorno SOCIAL_WEBHOOK_URL en Netlify apuntando a tu webhook de Make, Zapier, n8n o Metricool.',
        payload
      });
    }

    try {
      const parsedUrl = new URL(webhookUrl.trim());
      const body = JSON.stringify(payload);
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const req = transport.request(
        parsedUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'LUMIKO-SocialPublisher/1.0',
            'X-Lumiko-Event': 'social.campaign_publish',
            'X-Lumiko-Campaign-Id': payload.campaignId
          },
          timeout: 10000
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => { resData += chunk; });
          res.on('end', () => {
            const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
            console.log(`[lumiko-social] Despacho a webhook finalizado status=${res.statusCode} campaign=${payload.campaignId}`);
            resolve({
              dispatched: isSuccess,
              statusCode: res.statusCode,
              targetUrl: `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`,
              responseBody: resData.substring(0, 500),
              payload
            });
          });
        }
      );

      req.on('error', (err) => {
        console.error('[lumiko-social] Error al conectar con SOCIAL_WEBHOOK_URL:', err.message);
        resolve({
          dispatched: false,
          error: err.message,
          payload
        });
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('[lumiko-social] Timeout conectando a SOCIAL_WEBHOOK_URL');
        resolve({
          dispatched: false,
          error: 'webhook_timeout_10s',
          payload
        });
      });

      req.write(body);
      req.end();
    } catch (err) {
      console.error('[lumiko-social] URL de webhook inválida:', err.message);
      resolve({
        dispatched: false,
        error: `invalid_url: ${err.message}`,
        payload
      });
    }
  });
}

module.exports = {
  buildSocialPayload,
  dispatchToWebhook
};
