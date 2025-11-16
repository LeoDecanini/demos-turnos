import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

            {/* Imagen de fondo */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/instalanciones-1.jpg')" }}
            />

            {/* Overlay premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4CCB89]/20 via-background to-[#157347]/40"></div>

            {/* Glows animados */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#157347]/30 rounded-full blur-3xl animate-float"></div>
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#A9F5C9]/20 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>
            </div>


            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-8 animate-slide-in">
                    {/* Badge moderno */}
                    <div className="inline-flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-r from-[#A9F5C9]/20 to-[#157347]/20 rounded-full">
                            <Sparkles size={16} className="text-[#157347]" />
                        </div>
                        <span className="text-sm font-semibold text-[#157347]">Nutrición Premium Personalizada</span>
                    </div>

                    {/* Título con gradiente */}
                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-balance leading-tight">
                        Transforma tu
                        <span className="block bg-gradient-to-r from-[#A9F5C9] via-[#4CCB89] to-[#157347] bg-clip-text text-transparent animate-gradient-shift">
                            Salud Hoy
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                        Planes nutricionales personalizados diseñados científicamente para tu cuerpo, estilo de vida y objetivos reales.
                    </p>

                    {/* Botones con estilo moderno */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Button
                            size="lg"
                            className="bg-[#4CCB89] hover:bg-[#3BAB71] text-white shadow-lg shadow-[#4CCB89]/30 text-base font-semibold gap-2 transition-all"
                        >
                            Comenzar Ahora <ArrowRight size={20} />
                        </Button>


                        <Button
                            size="lg"
                            variant="outline"
                            className="text-base font-semibold hover:bg-background border-border/50"
                        >
                            Ver Tratamientos
                        </Button>
                    </div>

                    {/* Estadísticas con efecto moderno */}
                    <div className="grid grid-cols-3 gap-8 pt-16 max-w-lg mx-auto">
                        <div className="group">
                            <p className="text-4xl font-black bg-gradient-to-r from-[#A9F5C9] to-[#157347] bg-clip-text text-transparent">
                                500+
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Pacientes Transformados</p>
                        </div>

                        <div className="group">
                            <p className="text-4xl font-black bg-gradient-to-r from-[#157347] to-[#4CCB89] bg-clip-text text-transparent">
                                98%
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Satisfacción Garantizada</p>
                        </div>

                        <div className="group">
                            <p className="text-4xl font-black bg-gradient-to-r from-[#A9F5C9] to-[#157347] bg-clip-text text-transparent">
                                15+
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Años Experiencia</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
