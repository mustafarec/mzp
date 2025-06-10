"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handleNewsletterSignup } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const newsletterFormSchema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
});

type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;

const initialState = {
  message: "",
  errors: undefined,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? "Kaydolunuyor..." : "Abone Ol"}
    </Button>
  );
}

export default function NewsletterForm() {
  const [state, formAction] = useFormState(handleNewsletterSignup, initialState);
  const { toast } = useToast();

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      email: "",
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
      }
    }
  }, [state, toast, form]);

  return (
    <form action={formAction} className="space-y-4 max-w-md mx-auto">
      <div>
        <Label htmlFor="newsletter-email" className="sr-only">E-posta Adresiniz</Label>
        <Input
          id="newsletter-email"
          type="email"
          placeholder="E-posta adresinizi girin"
          {...form.register("email")}
          className={`w-full ${form.formState.errors.email || (state.errors as any)?.email ? "border-destructive" : ""}`}
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
        {(state.errors as any)?.email && (
           <p className="mt-1 text-sm text-destructive">{(state.errors as any).email[0]}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
