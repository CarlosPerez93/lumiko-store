/**
 * Script de despacho de campaña publicitaria a redes sociales.
 *
 * Uso: node tools/dispatch-social-campaign.js
 */
const path = require('path');
const socialPublisher = require(path.join(__dirname, '..', 'netlify', 'functions', '_lib', 'social-publisher.js'));

async function main() {
  const pixooCampaign = {
    title: 'Dale ese toque cyberpunk y anime a tu setup con el Panel LED Pixoo de LUMIKO 👾✨',
    caption: '📲 Control total desde tu móvil: elige entre miles de animaciones de la comunidad, crea tus propios diseños pixel art o sincronízalo con tu música.\n\n📦 Envío express en 24/48h con seguimiento\n🛡️ 3 Años de Garantía Oficial',
    hook: 'El accesorio que le faltaba a tu setup gamer ⚡',
    videoUrl: 'https://phoenix-video-pub.oss-accelerate.aliyuncs.com/video/cgt-20261028013500-m5hkq.mp4',
    imageUrl: 'https://sc02.alicdn.com/kf/A0370a90c537c462da35aa3eff0bffb3b5.png',
    productRef: 'panel-pixoo-16',
    discountCode: 'LUMI10',
    targetUrl: 'https://lumiko-store.netlify.app/producto/panel-pixoo-16',
    platforms: ['tiktok', 'instagram', 'pinterest', 'facebook'],
    hashtags: ['#LUMIKO', '#PixelArt', '#SetupGamer', '#DecoracionAnime', '#GamerRoom', '#GamingSetup', '#DivoomPixoo', '#LucesAnime', '#CyberpunkRoom', '#OtakuDecor']
  };

  console.log('== Preparando Campaña Publicitaria LUMIKO ==');
  const payload = socialPublisher.buildSocialPayload(pixooCampaign);
  console.log('Payload generado:', JSON.stringify(payload, null, 2));

  console.log('\n== Despachando a Webhook de Automatización ==');
  const result = await socialPublisher.dispatchToWebhook(payload);
  console.log('Resultado del despacho:', result);
}

main().catch(console.error);
