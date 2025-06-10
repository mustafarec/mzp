"use server";

import { z } from "zod";
import type { ContactFormData, NewsletterFormData } from "@/types";

// Define Zod schemas for validation
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
  message: z.string().min(10, { message: "Mesaj en az 10 karakter olmalıdır." }),
  honeypot: z.string().optional(), // Honeypot field
});

const newsletterFormSchema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
});

export async function handleContactFormSubmit(prevState: any, formData: FormData) {
  // Basic honeypot check
  if (formData.get("honeypot")) {
    return { message: "Spam algılandı.", success: false };
  }

  const validatedFields = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      message: "Form verileri geçersiz.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const data: ContactFormData = validatedFields.data;

  // Simulate sending data to an API or database
  console.log("Contact form submitted:", data);
  // In a real app, you would save this to Firestore or send an email.

  return { message: "Mesajınız başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.", success: true };
}


export async function handleNewsletterSignup(prevState: any, formData: FormData) {
  const validatedFields = newsletterFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      message: "E-posta adresi geçersiz.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  const data: NewsletterFormData = validatedFields.data;

  // Simulate saving to a database
  console.log("Newsletter signup:", data.email);
  // In a real app, you would save this to Firestore or a mailing list service.
  
  return { message: "Bültenimize başarıyla kaydoldunuz!", success: true };
}
