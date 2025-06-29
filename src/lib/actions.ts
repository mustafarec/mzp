"use server";

import { z } from "zod";
import type { ContactFormData, NewsletterFormData } from "@/types";
import { sendContactEmail } from "@/lib/email";

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

  // Send email using Resend
  try {
    const emailResult = await sendContactEmail({
      name: data.name,
      email: data.email,
      message: data.message,
    });

    if (!emailResult.success) {
      console.error("Email sending failed:", emailResult.error);
      return { 
        message: "Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin veya doğrudan email gönderin.", 
        success: false 
      };
    }

    console.log("Email sent successfully:", emailResult.data);
    return { 
      message: "Mesajınız başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.", 
      success: true 
    };
  } catch (error) {
    console.error("Unexpected error sending email:", error);
    return { 
      message: "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.", 
      success: false 
    };
  }
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
