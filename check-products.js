const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'marmara-ziraat'
  });
}

const db = admin.firestore();

async function checkProducts() {
  try {
    const snapshot = await db.collection('products').where('isActive', '==', true).get();
    const products = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      products.push({
        name: data.name,
        description: data.description || '',
        tags: data.tags || []
      });
    });
    
    console.log('=== TOPLAM ÜRÜN SAYISI:', products.length, '===\n');
    
    // Çiçek/hastalık ile ilgili ürünleri bul
    const flowerProducts = products.filter(p => {
      const text = `${p.name} ${p.description}`.toLowerCase();
      return text.includes('çiçek') || 
             text.includes('flower') || 
             text.includes('gübre') ||
             text.includes('hastalık') ||
             text.includes('fungisit') ||
             text.includes('koruma') ||
             text.includes('tedavi') ||
             text.includes('besini');
    });
    
    console.log('=== ÇİÇEK/HASTALIKLARA UYGUN ÜRÜNLER ===');
    flowerProducts.forEach((p, i) => {
      console.log(`${i+1}. ${p.name}`);
      if (p.description) {
        console.log(`   Açıklama: ${p.description.substring(0, 100)}...`);
      }
      console.log('');
    });
    
  } catch(error) {
    console.error('Hata:', error);
  }
  
  process.exit(0);
}

checkProducts(); 