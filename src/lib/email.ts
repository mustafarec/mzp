import { Resend } from 'resend';

interface EmailData {
  name: string;
  email: string;
  message: string;
}

export async function sendContactEmail(data: EmailData) {
  try {
    // Environment variable kontrolü
    
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const emailPayload = {
      from: 'İletişim Formu <iletisim@marmaraziraat.com.tr>',
      to: ['info@marmaraziraat.com.tr'], // Ana e-posta adresi
      replyTo: data.email,
      subject: `Yeni İletişim Mesajı - ${data.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
            Yeni İletişim Mesajı
          </h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Gönderen Bilgileri</h3>
            <p><strong>Ad Soyad:</strong> ${data.name}</p>
            <p><strong>E-posta:</strong> ${data.email}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">Mesaj</h3>
            <p style="line-height: 1.6; color: #555;">${data.message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 5px; border-left: 4px solid #16a34a;">
            <p style="margin: 0; font-size: 14px; color: #555;">
              Bu mesaj marmaraziraat.com.tr iletişim formundan gönderilmiştir.
              Yukarıdaki e-posta adresini kullanarak yanıtlayabilirsiniz.
            </p>
          </div>
        </div>
      `,
      text: `
Yeni İletişim Mesajı

Gönderen: ${data.name}
E-posta: ${data.email}

Mesaj:
${data.message}

Bu mesaj marmaraziraat.com.tr iletişim formundan gönderilmiştir.
      `
    };

    const { data: emailResult, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('E-posta gönderim hatası:', error);
      return { success: false, error: error.message || 'Bilinmeyen e-posta hatası' };
    }
    return { success: true, data: emailResult };
    
  } catch (error: any) {
    console.error('E-posta gönderim istisnası:', error);
    return { 
      success: false, 
      error: error.message || 'E-posta gönderimi başarısız oldu.' 
    };
  }
}