"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { Loader2, CheckCircle2, FileText } from 'lucide-react'
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL

export default function FormularioPublico() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.clientId as string
  const declarationId = params?.declarationId as string
  
  console.log('Formulario params:', { clientId, declarationId, API_BASE })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [declaration, setDeclaration] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (declarationId) {
      console.log('Fetching declaration with ID:', declarationId)
      fetchDeclaration()
    } else {
      console.log('Missing params:', { declarationId, clientId })
    }
  }, [declarationId])


  const fetchDeclaration = async () => {
    try {
      setLoading(true)
      const url = `${API_BASE}/bookingmodule/health-declarations/${declarationId}`
      console.log('Fetching declaration from:', url)
      const response = await axios.get(url)
      console.log('Declaration response:', response.data)
      setDeclaration(response.data)
      
      // Si ya tiene respuestas, poblar el estado
      if (response.data.answers && response.data.answers.length > 0) {
        const existingAnswers: Record<string, any> = {}
        response.data.answers.forEach((answer: any) => {
          existingAnswers[answer.questionId] = answer.answer
        })
        setAnswers(existingAnswers)
      }
    } catch (error) {
      console.error('Error fetching declaration:', error)
      toast.error('Error al cargar el formulario')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (declaration.clientResponse) {
      toast.info('Este formulario ya fue completado')
      return
    }

    // Validar campos requeridos
    const newErrors: Record<string, string> = {}
    declaration.templateSnapshot.questions.forEach((question: any) => {
      if (question.required) {
        const answer = answers[question.id]
        if (answer === undefined || answer === null || answer === '') {
          newErrors[question.id] = 'Este campo es obligatorio'
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }

    setErrors({})

    // Solo enviar respuestas que tengan valor
    const formattedAnswers = declaration.templateSnapshot.questions
      .filter((question: any) => {
        const answer = answers[question.id]
        return answer !== undefined && answer !== null && answer !== ''
      })
      .map((question: any) => ({
        questionId: question.id,
        answer: answers[question.id]
      }))

    console.log('Enviando respuestas:', formattedAnswers)
    console.log('Estado answers completo:', answers)

    try {
      setSaving(true)
      await axios.patch(
        `${API_BASE}/bookingmodule/health-declarations/${declarationId}/answers`,
        { answers: formattedAnswers }
      )
      toast.success('Formulario completado exitosamente')
      fetchDeclaration() // Recargar para mostrar en modo vista
    } catch (error: any) {
      console.error('Error saving:', error)
      toast.error(error.response?.data?.message || 'Error al guardar el formulario')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!declaration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Formulario no encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = declaration.clientResponse
  const questions = declaration.templateSnapshot.questions || []
  const clientInfo = declaration.clientId // El cliente viene populado desde el backend

  return (
    <div className="min-h-screen bg-background py-8 px-4 mt-20">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Información del Cliente */}
        {clientInfo && typeof clientInfo === 'object' && (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-400/30 text-slate-900 flex items-center justify-center font-semibold">
                  {(clientInfo.firstName?.charAt(0) || clientInfo.name?.charAt(0) || 'C').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {clientInfo.firstName && clientInfo.lastName 
                      ? `${clientInfo.firstName} ${clientInfo.lastName}`
                      : clientInfo.name || 'Cliente'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {clientInfo.email || clientInfo.phone || `ID: ${clientId?.slice(-8) || 'N/A'}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{declaration.templateSnapshot.name}</CardTitle>
                {declaration.templateSnapshot.description && (
                  <CardDescription className="mt-2">
                    {declaration.templateSnapshot.description}
                  </CardDescription>
                )}
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Completado</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.map((question: any, index: number) => {
                const hasError = errors[question.id]
                return (
                  <div key={question.id} className="space-y-2">
                    <Label className={hasError ? 'text-red-600' : ''}>
                      {index + 1}. {question.questionText}
                      {question.required && <span className="text-red-600 ml-1">*</span>}
                    </Label>

                    {question.type === 'BOOLEAN' && (
                      <>
                        <RadioGroup
                          value={answers[question.id]?.toString()}
                          onValueChange={(value) => {
                            setAnswers({...answers, [question.id]: value === 'true'})
                            if (errors[question.id]) {
                              const newErrors = {...errors}
                              delete newErrors[question.id]
                              setErrors(newErrors)
                            }
                          }}
                          disabled={isCompleted}
                          className={hasError ? 'border-red-300 rounded-md p-2' : ''}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`${question.id}-yes`} />
                            <Label htmlFor={`${question.id}-yes`}>Sí</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`${question.id}-no`} />
                            <Label htmlFor={`${question.id}-no`}>No</Label>
                          </div>
                        </RadioGroup>
                        {hasError && <p className="text-sm text-red-600">{hasError}</p>}
                      </>
                    )}

                    {question.type === 'TEXT' && (
                      <>
                        <Textarea
                          value={answers[question.id] || ''}
                          onChange={(e) => {
                            setAnswers({...answers, [question.id]: e.target.value})
                            if (errors[question.id]) {
                              const newErrors = {...errors}
                              delete newErrors[question.id]
                              setErrors(newErrors)
                            }
                          }}
                          disabled={isCompleted}
                          placeholder="Escribe tu respuesta..."
                          className={hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                        />
                        {hasError && <p className="text-sm text-red-600">{hasError}</p>}
                      </>
                    )}

                    {question.type === 'NUMBER' && (
                      <>
                        <Input
                          type="number"
                          value={answers[question.id] || ''}
                          onChange={(e) => {
                            setAnswers({...answers, [question.id]: parseFloat(e.target.value)})
                            if (errors[question.id]) {
                              const newErrors = {...errors}
                              delete newErrors[question.id]
                              setErrors(newErrors)
                            }
                          }}
                          disabled={isCompleted}
                          className={hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                        />
                        {hasError && <p className="text-sm text-red-600">{hasError}</p>}
                      </>
                    )}

                    {question.type === 'DATE' && (
                      <>
                        <Input
                          type="date"
                          value={answers[question.id] || ''}
                          onChange={(e) => {
                            setAnswers({...answers, [question.id]: e.target.value})
                            if (errors[question.id]) {
                              const newErrors = {...errors}
                              delete newErrors[question.id]
                              setErrors(newErrors)
                            }
                          }}
                          disabled={isCompleted}
                          className={hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                        />
                        {hasError && <p className="text-sm text-red-600">{hasError}</p>}
                      </>
                    )}

                    {question.type === 'MULTIPLE_CHOICE' && (
                      <>
                        <RadioGroup
                          value={answers[question.id]}
                          onValueChange={(value) => {
                            setAnswers({...answers, [question.id]: value})
                            if (errors[question.id]) {
                              const newErrors = {...errors}
                              delete newErrors[question.id]
                              setErrors(newErrors)
                            }
                          }}
                          disabled={isCompleted}
                          className={hasError ? 'border-red-300 rounded-md p-2' : ''}
                        >
                          {question.options?.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                              <Label htmlFor={`${question.id}-${optIndex}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                        {hasError && <p className="text-sm text-red-600">{hasError}</p>}
                      </>
                    )}
                  </div>
                )
              })}

              {!isCompleted && (
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Enviar Declaración
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isCompleted && (
                <div className="p-4 rounded-md bg-muted text-center text-sm text-muted-foreground">
                  Este formulario ya fue completado el {new Date(declaration.submittedAt).toLocaleDateString('es-AR')}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
