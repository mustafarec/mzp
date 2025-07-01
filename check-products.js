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
    
    flowerProducts.forEach((p, i) => {
      if (p.description) {
      }
    });
    
  } catch(error) {
    console.error('Hata:', error);
  }
  
  process.exit(0);
}

checkProducts(); 