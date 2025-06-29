import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Leaf, Users, Award, MapPin, Clock, Phone, Mail, Wrench, Search, Headphones, TreePine } from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: Leaf,
      title: "25+ Yıllık Deneyim",
      description: "Bahçe ürünleri sektöründe çeyrek asırlık deneyimimizle hizmet veriyoruz."
    },
    {
      icon: Users,
      title: "50.000+ Mutlu Müşteri",
      description: "On binlerce müşterinin güvenini kazanmış, kaliteli ürün ve hizmet anlayışımız."
    },
    {
      icon: Award,
      title: "Kalite Garantisi",
      description: "Tüm ürünlerimiz kalite standartlarına uygun ve garanti kapsamındadır."
    }
  ];

  const values = [
    "Müşteri memnuniyeti odaklı hizmet",
    "Çevre dostu ve organik ürün tercihi",
    "Güvenilir ve kaliteli markalarla çalışma",
    "Profesyonel danışmanlık hizmeti",
    "Hızlı ve güvenli teslimat",
    "Rekabetçi fiyat politikası"
  ];

  const services = [
    {
      icon: TreePine,
      name: "Danışmanlık Hizmeti",
      description: "Uzman kadromuzla bahçe ve peyzaj planlama konusunda profesyonel danışmanlık"
    },
    {
      icon: Search,
      name: "Ürün Seçim Desteği",
      description: "İhtiyaçlarınıza en uygun ürünleri seçmenizde size rehberlik ediyoruz"
    },
    {
      icon: Headphones,
      name: "7/24 Teknik Destek",
      description: "Ürün kullanımı ve bahçe bakımı konularında sürekli destek hizmeti"
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <Badge className="mb-6 bg-agriculture-100 text-agriculture-primary hover:bg-agriculture-200">
          Hakkımızda
        </Badge>
        <h1 className="apple-hero-text text-agriculture-primary mb-8">
          Marmara <span className="text-agriculture-accent">Ziraat</span>
        </h1>
        <p className="apple-hero-subtext text-agriculture-600 max-w-4xl mx-auto">
          İstanbul'da bahçe ürünleri sektöründe 25+ yıllık deneyimimizle, 
          çim tohumu, gübre, bahçe makineleri ve peyzaj malzemeleri konusunda 
          güvenilir çözümler sunuyoruz.
        </p>
      </section>

      {/* Company Image */}
      <section className="mb-16">
        <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1500"
            alt="Marmara Ziraat - Bahçe Ürünleri"
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-agriculture-primary/20" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="apple-card-hover border-0 shadow-lg bg-white text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-agriculture-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-agriculture-primary" />
                </div>
                <CardTitle className="text-xl font-headline text-agriculture-primary">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-agriculture-600 font-body">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="grid lg:grid-cols-2 gap-16 items-center mb-16">
        <div>
          <h2 className="text-4xl font-headline text-agriculture-primary mb-6">
            Hikayemiz
          </h2>
          <div className="space-y-4 font-body text-agriculture-600 leading-relaxed">
            <p>
              1998 yılından bu yana bahçe severlere kaliteli ürün sunma vizyonuyla hizmet veren Marmara Ziraat, 
              İstanbul Başakşehir'de güvenilir bir bahçe ürünleri merkezi olarak faaliyet göstermektedir.
            </p>
            <p>
              Çim tohumu ve gübrelerinden bahçe makinelerine, bitki hastalık ilaçlarından 
              peyzaj malzemelerine kadar geniş ürün yelpazemizle bahçe sahiplerine ve 
              peyzaj profesyonellerine kapsamlı çözümler sunuyoruz.
            </p>
            <p>
              Müşteri memnuniyetini ön planda tutan yaklaşımımızla ve sektördeki derin 
              deneyimimizle bahçenizin her ihtiyacını karşılamak için buradayız.
            </p>
          </div>
        </div>
        <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
          <Image
            src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200"
            alt="Bahçe Düzenlemesi"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-headline text-agriculture-primary mb-6">
            Değerlerimiz
          </h2>
          <p className="text-xl font-body text-agriculture-600 max-w-3xl mx-auto">
            Müşterilerimize sunduğumuz hizmetin temelinde yer alan değerlerimiz
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-agriculture-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-agriculture-primary flex-shrink-0" />
              <span className="font-body text-agriculture-700">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-headline text-agriculture-primary mb-6">
            Hizmetlerimiz
          </h2>
          <p className="text-xl font-body text-agriculture-600 max-w-3xl mx-auto">
            Size en iyi hizmeti sunmak için buradayız
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="apple-card-hover border-0 shadow-lg bg-white text-center">
              <CardHeader>
                <div className="w-24 h-24 bg-agriculture-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <service.icon className="h-12 w-12 text-agriculture-primary" />
                </div>
                <CardTitle className="text-xl font-headline text-agriculture-primary">
                  {service.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-agriculture-600 font-body">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-agriculture-light rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-headline text-agriculture-primary mb-6">
          Bizimle İletişime Geçin
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col items-center gap-2">
            <MapPin className="h-8 w-8 text-agriculture-primary" />
            <a 
              href="https://maps.google.com/maps?q=Bahçeşehir,+Hoşdere-Bahçeşehir+Yolu+No:66,+34488+Başakşehir/İstanbul"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-agriculture-600 text-sm text-center hover:text-agriculture-primary transition-colors cursor-pointer"
            >
              Bahçeşehir, Hoşdere-Bahçeşehir Yolu No:66<br />
              34488 Başakşehir/İstanbul
            </a>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Phone className="h-8 w-8 text-agriculture-primary" />
            <p className="font-body text-agriculture-600">
              (0212) 672 99 56
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Mail className="h-8 w-8 text-agriculture-primary" />
            <a 
              href="mailto:info@marmaraziraat.com" 
              className="font-body text-agriculture-600 hover:text-agriculture-primary transition-colors"
            >
              info@marmaraziraat.com
            </a>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Clock className="h-8 w-8 text-agriculture-primary" />
            <p className="font-body text-agriculture-600">
              09:00 - 17:00<br />
              (7 gün)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Hakkımızda - Marmara Ziraat",
    description: "İstanbul'da 15+ yıllık deneyimle bahçe ürünleri, çim tohumu, gübre ve peyzaj malzemeleri. Marmara Ziraat'ın hikayesi ve değerleri.",
  };
} 