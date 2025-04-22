"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

// Esquema de validación con zod
const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingrese un email válido.",
  }),
  telefono: z.string().optional(),
  mensaje: z.string().min(10, {
    message: "El mensaje debe tener al menos 10 caracteres.",
  }),
})

export default function FormularioWeb() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Definir el formulario con react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      mensaje: "",
    },
  })

  // Función para manejar el envío del formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Aquí normalmente enviarías los datos a tu backend
      console.log(values)

      // Simular una petición al servidor
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Formulario enviado",
        description: "Hemos recibido tu mensaje. Gracias por contactarnos.",
      })

      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el formulario. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Formulario de Contacto</CardTitle>
        <CardDescription>Completa el formulario para ponerte en contacto con nosotros.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+34 123 456 789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mensaje"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Escribe tu mensaje aquí..." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar mensaje"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Todos los campos marcados son obligatorios.
      </CardFooter>
    </Card>
  )
}
