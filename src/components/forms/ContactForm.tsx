"use client";

import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import { handleContactFormSubmit } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
  message: z.string().min(10, { message: "Mesaj en az 10 karakter olmalıdır." }),
  honeypot: z.string().optional(), // Honeypot field
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const initialState = {
  message: "",
  errors: undefined as any,
  success: false,
};

function SubmitButton({ isPending }: { isPending?: boolean }) {
  const { pending } = useFormStatus();
  const isLoading = pending || isPending;
  return (
    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
      {isLoading ? "Gönderiliyor..." : "Mesajı Gönder"}
    </Button>
  );
}

export default function ContactForm() {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      honeypot: "",
    },
  });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Başarılı!" : "Hata!",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      });
      if (state.success) {
        form.reset();
        setState(initialState);
      }
    }
  }, [state, toast, form]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await handleContactFormSubmit(state, formData);
      setState({
        message: result.message,
        errors: result.errors || undefined,
        success: result.success
      });
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Honeypot field for spam protection */}
      <div className="sr-only" aria-hidden="true">
        <Label htmlFor="honeypot">Lütfen bu alanı boş bırakın</Label>
        <Input {...form.register("honeypot")} id="honeypot" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Adınız Soyadınız</Label>
        <Input
          id="name"
          {...form.register("name")}
          className={form.formState.errors.name || (state.errors as any)?.name ? "border-destructive" : ""}
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
        {(state.errors as any)?.name && (
          <p className="mt-1 text-sm text-destructive">{(state.errors as any).name[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">E-posta Adresiniz</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          className={form.formState.errors.email || (state.errors as any)?.email ? "border-destructive" : ""}
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
        {(state.errors as any)?.email && (
          <p className="mt-1 text-sm text-destructive">{(state.errors as any).email[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Mesajınız</Label>
        <Textarea
          id="message"
          rows={6}
          {...form.register("message")}
          className={form.formState.errors.message || (state.errors as any)?.message ? "border-destructive" : ""}
        />
        {form.formState.errors.message && (
          <p className="mt-1 text-sm text-destructive">{form.formState.errors.message.message}</p>
        )}
        {(state.errors as any)?.message && (
          <p className="mt-1 text-sm text-destructive">{(state.errors as any).message[0]}</p>
        )}
      </div>
      
      <SubmitButton isPending={isPending} />
    </form>
  );
}