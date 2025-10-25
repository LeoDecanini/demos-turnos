"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react"
import ReusableBadge from "./reusable-badge"

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent
  const referrer = document.referrer
  const urlParams = new URLSearchParams(window.location.search)
  const utmSource = urlParams.get("utm_source") || ""
  const utmMedium = urlParams.get("utm_medium") || ""
  const utmCampaign = urlParams.get("utm_campaign") || ""
  const ipAddress = "192.168.1.100"
  return { userAgent, referrer, utmSource, utmMedium, utmCampaign, ipAddress }
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!
const ACCOUNTID = process.env.NEXT_PUBLIC_ACCOUNT_ID!

const Contacto = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" })
  const [errors, setErrors] = useState<{ [k in keyof typeof formData]?: string }>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const validateField = (name: keyof typeof formData, value: string) => {
    const v = value.trim()
    if (name === "name") return v.length < 2 ? "Ingresá tu nombre" : ""
    if (name === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Email inválido"
    if (name === "phone") return v.replace(/[^\d]/g, "").length < 7 ? "Teléfono inválido" : ""
    if (name === "message") return v.length < 5 ? "Contanos un poco más" : ""
    return ""
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    const err = validateField(name as keyof typeof formData, value)
    setErrors((p) => ({ ...p, [name]: err }))
  }

  useEffect(() => {
    const requiredFilled =
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.message.trim() !== ""
    const noErrors =
      !errors.name && !errors.email && !errors.phone && !errors.message
    setIsFormValid(requiredFilled && noErrors)
  }, [formData, errors])

  const validateAll = () => {
    const next: typeof errors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      message: validateField("message", formData.message),
    }
    setErrors(next)
    return Object.values(next).every((e) => !e)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const ok = validateAll()
    if (!ok) return

    setSubmitting(true)
    const browserInfo = getBrowserInfo()

    const payload: any = {
      accountId: `${ACCOUNTID}`,
      name: formData.name,
      email: formData.email,
      subject: "Mensaje de contacto",
      phone: formData.phone,
      message: formData.message,
      source: "website-inicio",
      formType: "inicio",
      variant: "inicio",
      ipAddress: browserInfo.ipAddress,
      userAgent: browserInfo.userAgent,
      referrer: browserInfo.referrer,
      utmSource: browserInfo.utmSource,
      utmMedium: browserInfo.utmMedium,
      utmCampaign: browserInfo.utmCampaign,
    }

    try {
      const response = await fetch(`${BACKEND}/contact-forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      setFormData({ name: "", email: "", phone: "", message: "" })
      setErrors({})
      ;(window as any).fbq?.("track", "Contact")
      router.push("/gracias")
    } catch (error) {
      console.error("Error sending form data:", error)
      setSubmitting(false)
    }
  }

  return (
    <section id="contacto" className="py-24 relative overflow-hidden bg-gray-50">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <ReusableBadge>Contacto</ReusableBadge>
            <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
              ¿Tenés alguna pregunta?
            </h2>
            <div                             className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 mb-4 rounded-full"></div>
            <p className="text-gray-600 mb-4 leading-relaxed-moveup">
              Estamos acá para ayudarte. Contáctanos para más información sobre nuestros servicios o para programar
              una consulta personalizada.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: MapPin,
                  title: "Ubicación",
                  content: "Paraná 1315, PB 4, Recoleta",
                  color: "from-blue-500 to-cyan-600",
                },
                {
                  icon: Phone,
                  title: "Teléfono",
                  content: "+54 11 2401-3754",
                  color: "from-green-500 to-emerald-600",
                },
                {
                  icon: Mail,
                  title: "Email",
                  content: "mgestetica22@outlook.com",
                  color: "from-purple-500 to-violet-600",
                },
                {
                  icon: Clock,
                  title: "Horarios",
                  content:
                      "Martes y Jueves: 10:00 - 19:30\nMiércoles y Viernes: 14:00 - 19:30\nSábados: 10:00 - 14:00\nLunes y Domingos: Cerrado",
                  color: "from-amber-500 to-yellow-600",
                },
              ].map((item, i) => (
                <div key={i} className="group flex items-start hover:bg-white/50 rounded-2xl transition-all duration-300 ">
                  <div className="flex-shrink-0">
                    <div className={`bg-gradient-to-r ${item.color} p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg mb-0 font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mt-0 text-sm leading-relaxed-moveup whitespace-pre-line font-medium">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Link href={"https://www.instagram.com/mgestetica22"} target={"_blank"}>
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 hover:from-pink-500 hover:to-rose-600 hover:text-white transition-all duration-300 font-semibold py-3 px-6"
                >
                  <Instagram className="h-5 w-5 mr-2" />
                  Seguinos en Instagram
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-white"></div>
              <div className="relative">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                    Envíanos un mensaje
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto rounded-full"></div>
                </div>

                <form className="space-y-6" onSubmit={handleFormSubmit} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group">
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-amber-600 transition-colors duration-300">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        aria-invalid={!!errors.name}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 ${
                          errors.name ? "border-rose-400 focus:ring-rose-400 focus:border-rose-400" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
                        }`}
                      />
                      {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
                    </div>
                    <div className="group">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-amber-600 transition-colors duration-300">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        aria-invalid={!!errors.email}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 ${
                          errors.email ? "border-rose-400 focus:ring-rose-400 focus:border-rose-400" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
                        }`}
                      />
                      {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email}</p> : null}
                    </div>
                  </div>

                  <div className="group">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-amber-600 transition-colors duration-300">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      aria-invalid={!!errors.phone}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 ${
                        errors.phone ? "border-rose-400 focus:ring-rose-400 focus:border-rose-400" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                    />
                    {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone}</p> : null}
                  </div>

                  <div className="group">
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-amber-600 transition-colors duration-300">
                      Asunto
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      onChange={() => {}}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80"
                      placeholder="(opcional)"
                    />
                  </div>

                  <div className="group">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-amber-600 transition-colors duration-300">
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      aria-invalid={!!errors.message}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 resize-none ${
                        errors.message ? "border-rose-400 focus:ring-rose-400 focus:border-rose-400" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                    ></textarea>
                    {errors.message ? <p className="mt-1 text-xs text-rose-600">{errors.message}</p> : null}
                  </div>

                  <Button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-4 shadow-xl transition-all duration-300 hover:scale-105 border-0"
                  >
                    <Mail className="mr-3 h-5 w-5" />
                    {submitting ? "Enviando..." : "Enviar Mensaje"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contacto
