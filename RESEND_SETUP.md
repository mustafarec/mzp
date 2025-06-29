# Resend Email Entegrasyonu Kurulum Rehberi

## 1. Resend Hesabı Oluşturma

1. [resend.com](https://resend.com) adresine gidin
2. "Get Started" butonuna tıklayın
3. GitHub, Google veya email ile kayıt olun
4. Email adresinizi doğrulayın

## 2. API Key Alma

1. Resend dashboard'a giriş yapın
2. Sol menüden "API Keys" seçeneğine tıklayın
3. "Create API Key" butonuna tıklayın
4. İsim verin (örn: "Marmara Ziraat Website")
5. "Sending access" yetkisini seçin
6. API key'i kopyalayın

## 3. Domain Doğrulama (İsteğe Bağlı)

**Önemli:** Şu an `onboarding@resend.dev` adresi kullanılıyor. Profesyonel görünüm için kendi domain'inizi ekleyin.

1. Resend dashboard'da "Domains" seçeneğine gidin
2. "Add Domain" butonuna tıklayın  
3. `marmaraziraat.com.tr` domain'ini ekleyin
4. DNS kayıtlarını domain sağlayıcınıza ekleyin:
   - TXT kaydı (SPF)
   - CNAME kaydı (DKIM)
5. Doğrulanınca `from` adresi şu şekilde değiştirilmeli:
   ```typescript
   from: 'İletişim Formu <iletisim@marmaraziraat.com.tr>'
   ```

## 4. Environment Variable Güncelleme

`.env` dosyasında:
```
RESEND_API_KEY=re_your_actual_api_key_here
```

## 5. Test Etme

1. Website'teki iletişim formunu doldurun
2. Form gönderildiğinde console'u kontrol edin
3. `info@marmaraziraat.com` adresinde email gelip gelmediğini kontrol edin

## 6. Email Adresi Değiştirme (İsteğe Bağlı)

`src/lib/email.ts` dosyasında `to` adresini değiştirin:
```typescript
to: ['yeni-email@marmaraziraat.com'], // İstediğiniz email adresi
```

## Özellikler

✅ **Responsive HTML template**  
✅ **Reply-to müşteri emaili olarak ayarlanır**  
✅ **Güvenli spam koruması**  
✅ **Error handling**  
✅ **Türkçe mesajlar**  

## Aylık Limitler

- **Ücretsiz Plan**: 3,000 email/ay
- **Paid Plan**: $20/ay ile 50,000 email

## Sorun Giderme

1. **API Key hatalı**: Console'da "Invalid API key" hatası
2. **Rate limit**: Çok fazla email gönderiminde geçici kısıtlama
3. **Domain doğrulanmadı**: `onboarding@resend.dev` kullanılır

Kurulum tamamlandıktan sonra bu dosyayı silebilirsiniz.