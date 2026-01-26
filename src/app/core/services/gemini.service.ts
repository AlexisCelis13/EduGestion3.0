import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface StudyPlanContent {
    module: string;
    topics: string[];
    sessions: number;
    description: string;
}

export interface GeneratedStudyPlan {
    planTitle: string;
    planDescription: string;
    recommendedSessions: number;
    sessionDurationMinutes: number;
    totalHours: number;
    estimatedPrice: number;
    planContent: StudyPlanContent[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class GeminiService {
    private apiKey = environment.geminiApiKey;
    // Use gemini-flash-latest which is verified to exist for this key
    private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    constructor() { }

    /**
     * Genera una respuesta del chatbot para continuar la conversación
     */
    async getChatResponse(
        userMessage: string,
        conversationHistory: ChatMessage[],
        tutorName: string
    ): Promise<string> {
        const systemPrompt = this.buildChatSystemPrompt(tutorName, conversationHistory);

        const messages: any[] = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Entendido, soy el asistente de ' + tutorName + '. ¿En qué puedo ayudarte?' }] }
        ];

        // Agregar historial
        messages.push(...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })));

        // Solo agregar el mensaje actual si no está ya al final del historial
        // Esto previene duplicar el mensaje si el componente ya lo agregó al historial
        const lastMessage = conversationHistory[conversationHistory.length - 1];
        if (!lastMessage || lastMessage.content !== userMessage) {
            messages.push({ role: 'user', parts: [{ text: userMessage }] });
        }

        return this.callGeminiWithRetry(messages);
    }

    /**
     * Llama a la API de Gemini con reintentos automáticos para rate limits
     */
    private async callGeminiWithRetry(
        messages: any[],
        maxRetries: number = 3,
        baseDelay: number = 2000
    ): Promise<string> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: messages,
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    })
                });

                if (response.status === 429) {
                    // Rate limit - esperar y reintentar
                    const delay = baseDelay * Math.pow(2, attempt);
                    console.log(`Rate limit alcanzado, reintentando en ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`Gemini API error: ${response.status}`);
                }

                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude procesar tu mensaje.';
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                if (attempt === maxRetries - 1) {
                    return 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo en unos segundos.';
                }
            }
        }
        return 'Lo siento, el servicio está muy ocupado. Por favor intenta de nuevo en un momento.';
    }

    /**
     * Genera un plan de estudios personalizado basado en la información recopilada
     */
    async generateStudyPlan(
        studentInfo: {
            name: string;
            academicLevel: string;
            subjects: string[];
            specificTopics: string;
            currentStruggles: string;
            learningGoals: string;
        },
        pricePerHour: number = 200, // Precio default por hora
        chatContext: string = '' // Contexto adicional del chat
    ): Promise<GeneratedStudyPlan> {
        const prompt = `
Eres un asesor educativo experto. Basándote en la siguiente información del estudiante y el contexto de la conversación, genera un plan de estudios personalizado y altamente detallado.

**Información del estudiante:**
- Nombre: ${studentInfo.name}
- Nivel académico: ${studentInfo.academicLevel}
- Materias de interés: ${studentInfo.subjects.join(', ')}
- Temas específicos a reforzar: ${studentInfo.specificTopics}
- Dificultades actuales: ${studentInfo.currentStruggles}
- Objetivos de aprendizaje: ${studentInfo.learningGoals}

**Contexto de la conversación (para referencia de temas):**
${chatContext}

**Configuración:**
- Precio por hora: $${pricePerHour} MXN
- Duración sesión: 60 min

**Instrucciones:**
1. Si la lista de "Materias de interés" está vacía, DEBES INFERIRLA del "Contexto de la conversación".
2. Genera un plan de estudios completo (NO genérico) que aborde específicamente los temas (POO, Álgebra, Inglés, etc.) discutidos.
3. El título debe ser atractivo y mencionar la materia principal explícitamente.
4. El plan debe dividirse en **módulos para UNA SOLA SESIÓN (1 sesión)**.
5. Define exactamente **1 sesión recomendada**.
6. Calcula el precio total (igual al precio por hora).

**IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en el siguiente formato exacto:**

{
  "planTitle": "Master class de [MATERIA DETECTADA]",
  "planDescription": "Propuesta de trabajo intensiva para [TEMAS]...",
  "recommendedSessions": 1,
  "sessionDurationMinutes": 60,
  "totalHours": 1,
  "estimatedPrice": 200,
  "planContent": [
    {
      "module": "Nombre descriptivo del módulo",
      "topics": ["Tema 1", "Tema 2"],
      "sessions": 1,
      "description": "Descripción..."
    }
  ]
}
`;

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: prompt }] }
                    ],
                    generationConfig: {
                        temperature: 0.3, // Más determinístico para JSON
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Extraer JSON del response (puede venir con markdown ```json)
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No se pudo extraer JSON de la respuesta');
            }

            const plan = JSON.parse(jsonMatch[0]) as GeneratedStudyPlan;

            // Validar y calcular precio si no viene correcto
            if (!plan.estimatedPrice || plan.estimatedPrice === 0) {
                plan.estimatedPrice = plan.totalHours * pricePerHour;
            }

            return plan;
        } catch (error) {
            console.error('Error generating study plan:', error);
            // Retornar un plan por defecto en caso de error
            return this.getDefaultStudyPlan(studentInfo, pricePerHour);
        }
    }

    /**
     * Regenera un plan con feedback del cliente
     */
    async refineStudyPlan(
        currentPlan: GeneratedStudyPlan,
        feedback: string,
        pricePerHour: number = 200
    ): Promise<GeneratedStudyPlan> {
        const prompt = `
Eres un asesor educativo. El cliente ha recibido el siguiente plan de estudios pero quiere modificaciones.

**Plan actual:**
${JSON.stringify(currentPlan, null, 2)}

**Feedback del cliente:**
"${feedback}"

**Precio por hora:** $${pricePerHour} MXN

Genera un nuevo plan de estudios ajustado según el feedback. Responde ÚNICAMENTE con un JSON válido en el mismo formato.
`;

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: prompt }] }
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No se pudo extraer JSON de la respuesta');
            }

            return JSON.parse(jsonMatch[0]) as GeneratedStudyPlan;
        } catch (error) {
            console.error('Error refining study plan:', error);
            return currentPlan; // Retornar el plan original si falla
        }
    }

    /**
     * Construye el prompt del sistema para el chatbot
     */
    private buildChatSystemPrompt(tutorName: string, history: ChatMessage[]): string {
        const collectedData = this.analyzeCollectedData(history);

        return `
Eres el asistente virtual de ${tutorName}, un tutor educativo. Tu objetivo es recopilar información para crear un plan de estudios personalizado.

**Información que necesitas recopilar (en orden):**
1. ¿La asesoría es para el cliente o para alguien más (hijo/a)?
2. Nombre completo del estudiante
3. Correo electrónico de contacto
4. Número de WhatsApp
5. (Si es para otro) Nombre y datos del padre/tutor responsable
6. Nivel académico (primaria, secundaria, preparatoria, universidad)
7. Materia(s) que necesita reforzar
8. Temas específicos difíciles
9. Objetivo principal (pasar examen, mejorar promedio, entender fundamentos)

**Información ya recopilada:**
${JSON.stringify(collectedData, null, 2)}

**Reglas:**
- Sé amable, profesional y empático
- Haz UNA pregunta a la vez
- Si ya tienes toda la información, indica que estás preparando el plan de estudios
- Usa emojis ocasionalmente para ser más cercano
- Respuestas cortas y claras (máximo 2-3 oraciones)
- Si el usuario se desvía del tema, redirige amablemente
- Valida emails y teléfonos sugiriendo correcciones si parecen incorrectos

**IMPORTANTE:** Cuando tengas toda la información necesaria, tu respuesta debe incluir exactamente el texto "[DATOS_COMPLETOS]" al final.
`;
    }

    /**
     * Analiza el historial para determinar qué datos ya se recopilaron
     */
    private analyzeCollectedData(history: ChatMessage[]): Record<string, any> {
        // Esta función podría ser más sofisticada con NLP
        // Por ahora, es un placeholder que se puede mejorar
        return {
            hasName: history.some(m => m.content.toLowerCase().includes('nombre')),
            hasEmail: history.some(m => m.content.includes('@')),
            hasPhone: history.some(m => /\d{10}/.test(m.content)),
            messagesCount: history.length
        };
    }

    /**
     * Plan por defecto en caso de error
     */
    private getDefaultStudyPlan(
        studentInfo: { name: string; subjects: string[]; academicLevel: string },
        pricePerHour: number
    ): GeneratedStudyPlan {
        const sessions = 6;
        const duration = 60;

        return {
            planTitle: `Plan de Refuerzo Académico para ${studentInfo.name}`,
            planDescription: `Plan personalizado enfocado en ${studentInfo.subjects.join(' y ')} para nivel ${studentInfo.academicLevel}.`,
            recommendedSessions: sessions,
            sessionDurationMinutes: duration,
            totalHours: sessions,
            estimatedPrice: sessions * pricePerHour,
            planContent: studentInfo.subjects.map(subject => ({
                module: subject,
                topics: ['Fundamentos', 'Práctica guiada', 'Evaluación'],
                sessions: Math.ceil(sessions / studentInfo.subjects.length),
                description: `Módulo de refuerzo en ${subject}`
            }))
        };
    }

    /**
     * Extrae datos estructurados del historial del chat
     */
    async extractDataFromChat(chatHistory: ChatMessage[]): Promise<{
        bookingFor: 'me' | 'other';
        studentFirstName: string;
        studentLastName: string;
        studentEmail: string;
        studentPhone: string;
        parentName?: string;
        parentEmail?: string;
        parentPhone?: string;
        academicLevel: string;
        subjects: string[];
        specificTopics: string;
        currentStruggles: string;
        learningGoals: string;
    }> {
        const prompt = `
Analiza la siguiente conversación de chat y extrae la información estructurada del estudiante.

**Conversación:**
${chatHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.content}`).join('\n')}

**Extrae y responde SOLO con un JSON válido en este formato:**
{
  "bookingFor": "me" o "other",
  "studentFirstName": "Nombre",
  "studentLastName": "Apellido",
  "studentEmail": "email@ejemplo.com",
  "studentPhone": "+521234567890",
  "parentName": "nombre del padre si aplica o null",
  "parentEmail": "email del padre si aplica o null",
  "parentPhone": "teléfono del padre si aplica o null",
  "academicLevel": "primaria/secundaria/preparatoria/universidad",
  "subjects": ["Materia1", "Materia2"],
  "specificTopics": "temas específicos mencionados",
  "currentStruggles": "dificultades mencionadas",
  "learningGoals": "objetivos mencionados"
}
`;

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
                })
            });

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Error extracting data from chat:', error);
        }

        // Valores por defecto si falla la extracción
        return {
            bookingFor: 'me',
            studentFirstName: '',
            studentLastName: '',
            studentEmail: '',
            studentPhone: '',
            academicLevel: '',
            subjects: [],
            specificTopics: '',
            currentStruggles: '',
            learningGoals: ''
        };
    }
}
