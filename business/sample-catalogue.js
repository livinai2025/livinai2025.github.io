(function () {
  const img = name => '/business/img/' + name;
  const products = [
    {
      id: 's-armchair', name: 'Sora bouclé lounge chair', sku: 'ST-101', category: 'Seating',
      material: 'Ivory bouclé and pale wood', price: '$490', dims: '76 × 78 × 75 cm',
      description: 'A low armless lounge chair with a rounded seat and a pale wood frame.',
      photo: 'p-armchair.png', scene: 'scene-sample-armchair.webp', style: 'Japandi', room: 'Living room',
      colors: ['#F0EBE2', '#B79F7E'],
    },
    {
      id: 's-sideboard', name: 'Linea fluted oak sideboard', sku: 'ST-104', category: 'Storage',
      material: 'Pale oak finish', price: '$980', dims: '160 × 43 × 75 cm',
      description: 'Rounded ends and fine vertical fluting give this low sideboard a soft profile.',
      photo: 'p-sideboard.png', scene: 'scene-sample-sideboard.webp', style: 'Contemporary', room: 'Dining room',
      colors: ['#D5BC91', '#A4845E'],
    },
    {
      id: 's-alder', name: 'Alder leather sofa', sku: 'ST-108', category: 'Seating',
      material: 'Cognac leather and walnut', price: '$1,890', dims: '224 × 92 × 78 cm',
      description: 'A low three-seat sofa with broad arms, a bench cushion and a recessed walnut base.',
      photo: 'catalogue-alder-product.webp', scene: 'catalogue-alder-room.webp', style: 'Modern', room: 'Living room',
      colors: ['#A35E33', '#422A20'],
    },
    {
      id: 's-tessa', name: 'Tessa travertine coffee table', sku: 'ST-112', category: 'Tables',
      material: 'Honed travertine', price: '$680', dims: 'Ø 86 × 36 cm',
      description: 'A round stone table with a bullnose edge and a single cylindrical base.',
      photo: 'catalogue-tessa-product.webp', scene: 'catalogue-tessa-room.webp', style: 'Mediterranean', room: 'Living room',
      colors: ['#D8BD9A', '#C3A484'],
    },
  ].map(({ photo, scene, style, room, ...product }) => {
    const example = { imageUrl: img(scene), style, room };
    return { ...product, sample: true, photoUrl: img(photo), cutoutUrl: img(photo), styles: [style], example, scenes: [example] };
  });
  window.LivinaiSampleCatalogue = {
    id: 'studio', title: 'The Studio Collection', brand: 'Livinai Sample Catalogue',
    sample: true, products, tryonEnabled: true,
  };
})();
