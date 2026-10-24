import { Product } from './product.model';

export const PRODUCTS: Product[] = [
  {
    id: 'tsukuyomi',
    name: 'Lámpara Tsukuyomi',
    tagline: 'Panel de luz anime con escenas de sakura',
    category: 'lamparas',
    price: 89.9,
    oldPrice: 109.9,
    image: 'assets/img/p-tsukuyomi.png',
    rating: 4.9,
    reviews: 412,
    badge: 'Top ventas',
    badgeTone: 'pink',
    description:
      'Tres capas de acrílico grabado a láser dibujan una puerta torii bajo la luna llena. La luz atraviesa cada capa para crear profundidad real: parece que la escena flota en tu habitación.',
    features: [
      '16,7 millones de colores con 12 escenas preajustadas',
      'Control por app, mando táctil y Alexa / Google Home',
      'Temporizador y modo amanecer para dormir sin pantallas',
      'Base magnética giratoria de 360°'
    ],
    specs: [
      { label: 'Dimensiones', value: '24 × 18 × 6 cm' },
      { label: 'Potencia', value: '12 W · USB-C' },
      { label: 'Conectividad', value: 'Wi-Fi 2,4 GHz + BLE' },
      { label: 'Edad recomendada', value: '6+ años / adultos' }
    ],
    colors: [
      { name: 'Sakura', hex: '#FF3D8A' },
      { name: 'Umi', hex: '#22D3EE' },
      { name: 'Yuki', hex: '#E5E7EB' }
    ],
    stock: 24,
    bestseller: true,
    sales: 1860
  },
  {
    id: 'kitsune',
    name: 'Farol Kitsune',
    tagline: 'Luz portátil con máscara de zorro',
    category: 'lamparas',
    price: 74.9,
    image: 'assets/img/p-kitsune.png',
    rating: 4.8,
    reviews: 187,
    badge: 'Nuevo',
    badgeTone: 'lime',
    description:
      'Un farol de cristal esmerilado con la cara de un kitsune grabada. Se enciende con un toque, funciona 12 horas con batería y pasa de la mesilla a la mesa del jardín sin cables.',
    features: [
      'Batería recargable de 12 h reales de autonomía',
      'Grabado del zorro iluminado desde el interior',
      'Tres temperaturas de luz: ámbar, cálida y luna',
      'Cuerpo IP54 apto para terraza'
    ],
    specs: [
      { label: 'Dimensiones', value: '14 × 14 × 20 cm' },
      { label: 'Autonomía', value: 'Hasta 12 h' },
      { label: 'Carga', value: 'USB-C · 2,5 h' },
      { label: 'Material', value: 'Vidrio esmerilado + roble' }
    ],
    colors: [
      { name: 'Ámbar', hex: '#FFB347' },
      { name: 'Rubor', hex: '#FF6FA5' },
      { name: 'Nocturno', hex: '#312E81' }
    ],
    stock: 41,
    isNew: true,
    sales: 640
  },
  {
    id: 'mochi',
    name: 'Robot Mochi',
    tagline: 'Compañero con IA y luz emocional',
    category: 'robots',
    price: 149,
    oldPrice: 179,
    image: 'assets/img/p-mochi.png',
    rating: 4.9,
    reviews: 326,
    badge: 'Top ventas',
    badgeTone: 'pink',
    description:
      'Mochi escucha, gira la cabeza y cambia de color según la emoción que detecta en tu voz. Cuenta cuentos con luz ambiental, propone rutinas y se apaga solo cuando el peque se duerme.',
    features: [
      'IA conversacional en español, sin pantallas',
      'Anillo LED de 16 M de colores sincronizado con la voz',
      'Modo cuentos con más de 60 historias de luz',
      'Sensor de presencia y rutina de buenos días'
    ],
    specs: [
      { label: 'Dimensiones', value: '18 × 14 × 12 cm' },
      { label: 'Batería', value: '18 h · base de carga' },
      { label: 'Conectividad', value: 'Wi-Fi + BLE 5.1' },
      { label: 'Edad', value: '5+ años' }
    ],
    colors: [
      { name: 'Nube', hex: '#F8FAFC' },
      { name: 'Menta', hex: '#34D399' },
      { name: 'Lavanda', hex: '#A78BFA' }
    ],
    stock: 12,
    bestseller: true,
    sales: 1120
  },
  {
    id: 'neko',
    name: 'Neko Bot',
    tagline: 'Mascota robótica con ojos anime',
    category: 'robots',
    price: 119,
    image: 'assets/img/p-neko.png',
    rating: 4.7,
    reviews: 203,
    description:
      'Una mascota de felpa con pantalla de ojos que parpadea, ronronea y te sigue por la habitación. Reconoce caricias, responde a la voz y tiene un modo siesta con luz cálida.',
    features: [
      'Ojos expresiónales con 14 estados de ánimo',
      'Reconoce gestos y caricias en la cabeza',
      'Ronroneo real con sensor de vibración',
      'Modo siesta con luz de acompañamiento'
    ],
    specs: [
      { label: 'Dimensiones', value: '22 × 16 × 18 cm' },
      { label: 'Batería', value: '10 h de juego' },
      { label: 'Sensores', value: 'Táctil, voz, movimiento' },
      { label: 'Lavable', value: 'Funda desmontable' }
    ],
    colors: [
      { name: 'Gris niebla', hex: '#CBD5E1' },
      { name: 'Crema', hex: '#FDE68A' }
    ],
    stock: 18,
    sales: 480
  },
  {
    id: 'nebula',
    name: 'Proyector Nebula',
    tagline: 'Galaxia en el techo, en 21 modos',
    category: 'proyeccion',
    price: 59.9,
    oldPrice: 74.9,
    image: 'assets/img/p-nebula.png',
    rating: 4.8,
    reviews: 518,
    badge: '-20%',
    badgeTone: 'cyan',
    description:
      'Convierte cualquier techo en una nebulosa con estrellas en movimiento. Se controla desde la app o con un mando y se apaga solo con el temporizador de 30, 60 o 90 minutos.',
    features: [
      '21 combinaciones de nebulosa + constelaciones',
      'Rotación silenciosa de 360° (< 22 dB)',
      'Temporizador y modo respiración para bebés',
      'Mando incluido + control por app'
    ],
    specs: [
      { label: 'Cobertura', value: 'Hasta 30 m²' },
      { label: 'Lúmenes', value: '180 lm regulables' },
      { label: 'Alimentación', value: 'USB-C' },
      { label: 'Ruido', value: '< 22 dB' }
    ],
    colors: [
      { name: 'Violeta', hex: '#8B5CF6' },
      { name: 'Océano', hex: '#22D3EE' },
      { name: 'Negro', hex: '#1F2937' }
    ],
    stock: 63,
    sales: 2400
  },
  {
    id: 'pixel',
    name: 'Panel Pixel Arcade',
    tagline: 'Cuadro LED con arte pixel animado',
    category: 'gaming',
    price: 99,
    image: 'assets/img/p-pixel.png',
    rating: 4.9,
    reviews: 141,
    badge: 'Nuevo',
    badgeTone: 'lime',
    description:
      'Un lienzo de 16 × 16 píxeles que reproduce escenas de videojuego, reacciona a tu música y se sincroniza con el móvil. Puedes dibujar tu propio pixel art desde la app.',
    features: [
      '40 animaciones pixel preinstaladas',
      'Modo música con micrófono integrado',
      'Editor de pixel art propio en la app',
      'Montaje en pared o soporte de sobremesa'
    ],
    specs: [
      { label: 'Matriz', value: '16 × 16 píxeles LED' },
      { label: 'Dimensiones', value: '32 × 32 × 4 cm' },
      { label: 'Conectividad', value: 'Wi-Fi + BLE' },
      { label: 'Consumo', value: '10 W' }
    ],
    colors: [
      { name: 'Negro', hex: '#111827' },
      { name: 'Blanco', hex: '#F3F4F6' }
    ],
    stock: 27,
    isNew: true,
    sales: 390
  },
  {
    id: 'drone',
    name: 'Dron Stellar Mini',
    tagline: 'Vuelo fácil con luces para principiantes',
    category: 'gaming',
    price: 129,
    image: 'assets/img/p-drone.png',
    rating: 4.6,
    reviews: 96,
    description:
      'Un dron pensado para manos pequeñas: hélices protegidas, despegue con un botón y luces LED que cambian de color en el aire. Incluye dos baterías y modo seguimiento suave.',
    features: [
      'Hélices con protección total 360°',
      'Despegue y aterrizaje con un botón',
      'Luces LED RGB con 6 patrones de vuelo',
      'Dos baterías: 24 min de vuelo total'
    ],
    specs: [
      { label: 'Peso', value: '148 g' },
      { label: 'Autonomía', value: '12 min por batería' },
      { label: 'Alcance', value: '60 m' },
      { label: 'Edad', value: '8+ años' }
    ],
    colors: [
      { name: 'Cian', hex: '#22D3EE' },
      { name: 'Coral', hex: '#FB7185' }
    ],
    stock: 9,
    sales: 210
  },
  {
    id: 'lumen',
    name: 'Cubo Lumen',
    tagline: 'Luz táctil para los más pequeños',
    category: 'lamparas',
    price: 39.9,
    image: 'assets/img/p-lumen.png',
    rating: 4.8,
    reviews: 289,
    description:
      'Un cubo de acrílico esmerilado que se enciende con un toque y cambia de color con cada palmada. Sin cables, sin pantallas y con una autonomía de 15 horas.',
    features: [
      '9 colores y modo respiración suave',
      'Batería de 15 h y carga USB-C',
      'Caídas de hasta 1,2 m sin roturas',
      'Sin piezas pequeñas: seguro desde 0 años'
    ],
    specs: [
      { label: 'Dimensiones', value: '10 × 10 × 10 cm' },
      { label: 'Autonomía', value: '15 h' },
      { label: 'Material', value: 'Acrílico esmerilado' },
      { label: 'Edad', value: '0+ años' }
    ],
    colors: [
      { name: 'Melocotón', hex: '#FDBA74' },
      { name: 'Lila', hex: '#C4B5FD' },
      { name: 'Menta', hex: '#6EE7B7' }
    ],
    stock: 55,
    sales: 1530
  }
];
