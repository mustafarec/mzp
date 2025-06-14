import ContactForm from "@/components/forms/ContactForm";
import { MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Bize Ulaşın</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-body">
          Sorularınız, önerileriniz veya işbirliği talepleriniz için bizimle iletişime geçmekten çekinmeyin.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div className="bg-card p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-primary">İletişim Formu</h2>
          <ContactForm />
        </div>
        
        <div className="bg-card p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-primary">Konumumuz</h2>
          <div className="space-y-4">
            <div className="w-full h-80 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3006.8969486982756!2d28.8093!3d41.1086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa7040068086b%3A0x3c6a3fc1b3cb5b94!2sBah%C3%A7e%C5%9Fehir%2C%20Ho%C5%9Fdere-Bah%C3%A7e%C5%9Fehir%20Yolu%20No%3A66%2C%2034488%20Ba%C5%9Fak%C5%9Fehir%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1634567890123!5m2!1str!2str"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Marmara Ziraat Konum"
              ></iframe>
            </div>
            <a 
              href="https://maps.google.com/maps?q=Bahçeşehir,+Hoşdere-Bahçeşehir+Yolu+No:66,+34488+Başakşehir/İstanbul"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Google Maps'te Aç
            </a>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-muted-foreground">
                <strong>Adres:</strong> Bahçeşehir, Hoşdere-Bahçeşehir Yolu No:66, 34488 Başakşehir/İstanbul
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Çalışma Saatleri:</strong> Hafta içi & Cumartesi: 08:00-18:00 • Pazar: 09:00-16:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "İletişim - Marmara Ziraat",
    description: "Marmara Ziraat ile iletişime geçin. Sorularınız ve önerileriniz için buradayız.",
  };
}
