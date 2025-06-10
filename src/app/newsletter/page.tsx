import NewsletterForm from "@/components/forms/NewsletterForm";
import { Newspaper } from "lucide-react";

export default function NewsletterPage() {
  return (
    <div className="container mx-auto py-12 md:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <Newspaper className="h-16 w-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">E-Bültenimize Kaydolun</h1>
        <p className="text-lg text-muted-foreground mb-8 font-body">
          Tarım dünyasındaki en son yeniliklerden, özel tekliflerimizden ve Marmara Ziraat haberlerinden ilk siz haberdar olun.
        </p>
        <div className="bg-card p-8 rounded-lg shadow-lg">
          <NewsletterForm />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Bülten Kayıt - Marmara Ziraat",
    description: "Marmara Ziraat e-bültenine kaydolarak tarım dünyasındaki gelişmelerden ve özel tekliflerden haberdar olun.",
  };
}
