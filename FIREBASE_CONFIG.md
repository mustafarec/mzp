# Firebase Yapılandırma Talimatları

## 1. .env Dosyası Oluşturun

Proje kök dizininde `.env` dosyası oluşturun ve aşağıdaki değerleri ekleyin:

```env
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ziraatx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ziraatx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ziraatx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (Server-side) - İsteğe bağlı
FIREBASE_PROJECT_ID=ziraatx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@ziraatx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCnO83vAcpDIk6V\nV2RzFPLwMr/0OjeWQ+IQ9SuFIkF976HXcd35V3CEzuEdZIOa4X8Z65O0YK3Vy2Hv\n2C6KNnc/o/8aBPM1fPWr5+5QHKvpP8qOPaclAMWEboLZth6HABg7q0TlazgKiKo6\neJrk8bNOT4CITP+8EZ+M0pS1ud2Z3VS2pRLlvLAl9ivb7KHBkOGQOUVean+lFTtv\naSshWYnGH71KJCkPxlJoEJpFXNDWexo/+R2Lxc+n5YDhuz4b3NThQuHg2ZIUmx12\nZm1B/dFFC3KXGO6RqoLEWP6RVfBY1xeWCvQDgXjsiHsviLI6Riubg/UdDRRR/uU5\nAGJAJP9BAgMBAAECggEAPCIThy04GxLDegzOKFlwj7FX94xVf5lSOTHHX9x0+0FH\nCy69GBL6eS7goI6Lig4qg1oDpxkaeOVkhndQKM+z6nTgXm1IPMP9nL5NoY3lvP38\nqk/+AZ6450lLkNhdOsLsc8w+flYi9Rq2R0clv0wv4ulQePJjBK+7lMoFwiCez9vC\nIRtZF2bQuctSLf/DCr4OCRSyGcTcMhB6bstcO//oCT4YC38H17uVj11RKkB0r8pa\nx9/kAeLY9TRj867fjoyiS0m/FLOpok2sZixrVx7xIAFGZTZJLbrZEOGJZnIw6Vjm\nuCQmpu7y2OQghQEV8fRUyFZRg3iX/rm2zgGeAqmDdwKBgQDl49mbVgMS1qQhHpL0\nIgL3PKvRet01T0Xe+Hh/Q+t+25R2HFiEaBIZrtvmoh4UIvytV6efYvFTAb5VTS2X\nbJOowH+MZNyqBnrf8foDn8+K54jq+hn+/Kkb2meCApIsDEYvuI2R8tYSj2Lg7axl\nJXAyn59fr48vp0/XdRfpEK9ezwKBgQC6OjE6KiBvQkt5sFpbUpNgZ2nlH45VaUOs\ny8j4kSxRrai4Uc/jFtpgOR4Zp4/atVylJP5fjfEvIhQEN1ekNAoH6ne10MdwW5xc\n07u3AHSGgMSXPYV8JIKIAw7oJ18018VZBzNzDfEVys6gT+lAMQzjvoqF11I9QPhr\nQ3ztGBvE7wKBgDyQxNnJ1VF3PxKCrZCoDUP5tgKgbfsHgY72wzg0OqzXSMu9OAza\nJjqh+MlQWMBRX2SDvWOee5m00eJDTQmhz10cKf5g7EnXHzQ02ftudQ1RZp8ReRvW\nkO8HoVF9P+le6nbUFmgnJAMLx68ertaPAHo115Ur+XtChyRqcvwyKyG9AoGANdVW\nn6rH34G5kb7iD94qDkc2vG5H1fbtAkmSmhBVUHMz/7xerRXRINnCEsZ2dlHRK0gr\nZHIC0441XRamdig48hrcaimlTZyd8dOfQwKVrMASlGnLaZygQzMnHwMqqXrqaJcF\nT3ArThJncr5G/jBvunI9Vv1sn5pldZR3y44ZkO8CgYBobViRYa1UhNjp4UhywdeR\noKxr2brl4JG9Ife2d3N8FWB46f2hpppxXaldyHJj7RmFoDsiSXJy6HR8c5XaaoY+\nZkoFt7HJ5ymc2s/Pil4EIT6eEy8UW1+ICXICN5ajrFGwuOU0DifW4covG7RBhwKx\n0DIN35wvq+Q+2XXJEEecJw==\n-----END PRIVATE KEY-----"
```

## 2. Firebase Console'dan Web App Config Bilgilerini Alın

Eksik olan client-side değerleri tamamlamak için:

1. [Firebase Console](https://console.firebase.google.com) → `ziraatx` projesine gidin
2. **Project Settings** (⚙️) → **General** tab
3. **Your apps** bölümünde **Web app** seçin veya ekleyin
4. **Firebase SDK snippet** → **Config** seçin
5. Aşağıdaki değerleri `.env` dosyasındaki boş alanlara ekleyin:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`  
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

## 3. Güvenlik Kontrolü

✅ `.env` dosyasının `.gitignore`'da olduğundan emin olun
✅ Environment variables'lar `NEXT_PUBLIC_` prefix'i ile client-side'da kullanılabilir
✅ Admin SDK credentials sadece server-side'da kullanılır

## 4. Test

```bash
npm run dev
```

Firebase bağlantısını test etmek için projeyi çalıştırın. 