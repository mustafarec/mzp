import ContactForm from "@/components/forms/ContactForm";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 md:py-16">
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
        
        <div className="space-y-8">
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-primary">İletişim Bilgilerimiz</h2>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-center">
                <Mail className="h-6 w-6 mr-3 text-primary" />
                <span>info@marmaraziraat.com</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-6 w-6 mr-3 text-primary" />
                <span>(0212) 672 99 56</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-6 w-6 mr-3 text-primary mt-1" />
                <span>Bahçeşehir, Hoşdere-Bahçeşehir Yolu No:66, 34488 Başakşehir/İstanbul</span>
              </li>
            </ul>
          </div>

          <div className="bg-card p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-primary">Çalışma Saatlerimiz</h2>
            <div className="text-foreground space-y-2">
              <p><strong>Hafta içi:</strong> 09:00 - 17:00</p>
              <p><strong>Cumartesi:</strong> 09:00 - 17:00</p>
              <p><strong>Pazar:</strong> 09:00 - 17:00</p>
              <p className="text-sm text-muted-foreground mt-3">
                * Bayram günlerinde çalışma saatleri değişebilir.
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
