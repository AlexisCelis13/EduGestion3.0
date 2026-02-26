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
    private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
        baseDelay: number = 15000,
        isJson: boolean = false
    ): Promise<string> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const generationConfig: any = {
                    temperature: isJson ? 0.3 : 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                };

                if (isJson) {
                    generationConfig.responseMimeType = "application/json";
                }

                const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: messages,
                        generationConfig
                    })
                });

                if (response.status === 429) {
                    // Rate limit - esperar y reintentar con delay más largo
                    const delay = baseDelay * Math.pow(1.5, attempt);
                    console.log(`Rate limit alcanzado, reintentando en ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    console.error('Gemini API error details:', {
                        status: response.status,
                        statusText: response.statusText,
                        body: errorBody
                    });
                    throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorBody)}`);
                }

                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude procesar tu mensaje.';
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                if (attempt === maxRetries - 1) {
                    throw error; // Lanzar el error en lugar de devolver un string para que el componente lo maneje
                }
                // Si hay error de red, también esperamos antes de reintentar
                await new Promise(resolve => setTimeout(resolve, baseDelay));
            }
        }
        throw new Error('Rate limit exceeded after retries');
    }

    /**
     * Limpia la respuesta de Gemini para obtener solo el JSON válido
     */
    private cleanJson(text: string): string {
        // Eliminar bloques de código markdown
        let clean = text.replace(/```json/g, '').replace(/```/g, '');
        // Encontrar el primer { y el último }
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');

        if (start !== -1 && end !== -1) {
            return clean.substring(start, end + 1);
        }
        return clean;
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
Eres un asesor educativo experto creando planes de estudio personalizados. Basándote en la siguiente información del estudiante y el contexto de la conversación, genera un plan de estudios detallado y profesional.

**Información del estudiante:**
- Nombre: ${studentInfo.name}
- Nivel académico: ${studentInfo.academicLevel}
- Materias de interés: ${studentInfo.subjects.join(', ')}
- Temas específicos a reforzar: ${studentInfo.specificTopics}
- Dificultades actuales: ${studentInfo.currentStruggles}
- Objetivos de aprendizaje: ${studentInfo.learningGoals}

**Contexto de la conversación:**
${chatContext}

**Configuración:**
- Precio por hora: $${pricePerHour} MXN
- Duración sesión: 60 min

**Instrucciones para generar el plan:**
1. Determina el número IDEAL de sesiones (entre 1 y 12) basado en la complejidad de los temas y objetivos. NO te limites a 1 sesión si se necesita más para cubrir los temas bien.
2. Si el objetivo es "pasar un examen" urgente, sugiere sesiones intensivas.
3. El título debe ser profesional y atractivo (ej: "Programa de Dominio en [Materia]").
4. Calcula el precio total multiplicando el número de sesiones por el precio por hora, puedes aplicar un pequeño descuento (5-10%) si son más de 5 sesiones.
5. Divide el contenido en módulos lógicos.

**IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en el siguiente formato exacto (sin texto adicional):**

{
  "planTitle": "Título del Plan",
  "planDescription": "Descripción ejecutiva del plan y su enfoque...",
  "recommendedSessions": 4,
  "sessionDurationMinutes": 60,
  "totalHours": 4,
  "estimatedPrice": 800,
  "planContent": [
    {
      "module": "Nombre del Módulo 1",
      "topics": ["Tema 1.1", "Tema 1.2"],
      "sessions": 2,
      "description": "Explicación de lo que se verá..."
    },
    {
      "module": "Nombre del Módulo 2",
      "topics": ["Tema 2.1"],
      "sessions": 2,
      "description": "Explicación..."
    }
  ]
}
`;

        try {
            const messages = [{ role: 'user', parts: [{ text: prompt }] }];
            const textResponse = await this.callGeminiWithRetry(messages, 3, 15000, true);

            // Limpiar y parsear JSON
            const jsonStr = this.cleanJson(textResponse);

            try {
                const plan = JSON.parse(jsonStr) as GeneratedStudyPlan;

                // Validaciones post-generación
                if (!plan.estimatedPrice || plan.estimatedPrice === 0) {
                    plan.estimatedPrice = (plan.totalHours || plan.recommendedSessions) * pricePerHour;
                }

                return plan;
            } catch (e) {
                console.error('Error parsing JSON from Gemini:', e);
                console.log('Raw response:', textResponse);
                throw new Error('Formato de respuesta inválido');
            }

        } catch (error) {
            console.error('Error generating study plan:', error);
            // Si falla la generación por API o Parsing, usar fallback
            // Construimos un objeto simple con los datos que tenemos para el fallback
            const fallbackInfo = {
                name: studentInfo.name || 'Estudiante',
                subjects: studentInfo.subjects.length > 0 ? studentInfo.subjects : ['Refuerzo Académico'],
                academicLevel: studentInfo.academicLevel || 'General'
            };
            return this.getDefaultStudyPlan(fallbackInfo, pricePerHour);
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
Eres un asesor educativo experto mejorando planes de estudio personalizados. El cliente ha recibido el siguiente plan de estudios pero quiere modificaciones.

**Plan actual:**
${JSON.stringify(currentPlan, null, 2)}

**Feedback del cliente para modificar el plan:**
"${feedback}"

**Precio por hora:** $${pricePerHour} MXN

**Instrucciones:**
1. Mantén la estructura profesional del plan original, pero aplica los cambios solicitados por el cliente.
2. Si pide más sesiones, ajusta "recommendedSessions", "totalHours" y "estimatedPrice" (multiplicando horas * precio).
3. Si pide cambiar temas, modifica el array "planContent".
4. Si pide cambiar el enfoque, ajusta la descripción en "planDescription".

**IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en el mismo formato, sin explicaciones adicionales:**

{
  "planTitle": "Master class de [MATERIA DETECTADA]",
  "planDescription": "Propuesta de trabajo intensiva para [TEMAS]...",
  "recommendedSessions": 2,
  "sessionDurationMinutes": 60,
  "totalHours": 2,
  "estimatedPrice": 400,
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
            const messages = [{ role: 'user', parts: [{ text: prompt }] }];
            const textResponse = await this.callGeminiWithRetry(messages, 3, 15000, true);

            // Limpiar y parsear JSON
            const jsonStr = this.cleanJson(textResponse);
            return JSON.parse(jsonStr) as GeneratedStudyPlan;
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

        return `Eres el asistente virtual de ${tutorName}, un tutor educativo. Tu misión es recopilar la siguiente información para crear un plan de estudios personalizado.

INFORMACIÓN A RECOPILAR (en este orden estricto):
1. Para quién es la asesoría (para el mismo usuario o para su hijo/a)
2. Nombre completo del estudiante
3. (Solo si es para otra persona) Nombre del padre o tutor responsable
4. Correo electrónico de contacto (del estudiante, o del tutor si es para otra persona)
5. Número de WhatsApp o teléfono (del estudiante, o del tutor si es para otra persona)
6. Nivel académico: primaria, secundaria, preparatoria o universidad
7. Materia o materias que necesita reforzar
8. Temas específicos que se le dificultan
9. Objetivo principal (pasar un examen, mejorar promedio, entender la materia, etc.)

INFORMACIÓN YA RECOPILADA HASTA AHORA:
${JSON.stringify(collectedData, null, 2)}

REGLAS ESTRICTAS:
- Haz solo UNA pregunta a la vez, nunca varias juntas
- Sé amable, cálido y empático, usa algunos emojis
- Respuestas breves (2-3 oraciones máximo)
- Si el usuario ya respondió algo anteriormente, NO lo vuelvas a preguntar
- Revisa bien cuáles datos ya están en "INFORMACIÓN YA RECOPILADA" antes de preguntar
- Una vez que tengas los 9 puntos cubiertos, confirma los datos al usuario con un resumen y dile que procederás a generar su plan
- CUANDO TENGAS TODOS LOS DATOS, incluye exactamente este texto al final de tu mensaje: [DATOS_COMPLETOS]`;
    }

    /**
     * Analiza el historial para determinar qué datos ya se recopilaron
     */
    private analyzeCollectedData(history: ChatMessage[]): Record<string, string | boolean | number | null> {
        const userMessages = history.filter(m => m.role === 'user').map(m => m.content);
        const allText = userMessages.join(' ');

        const emailMatch = allText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = allText.match(/[\d\s\-+]{8,15}/);

        let bookingFor: string | null = null;
        if (/para m[ií]|yo mismo|soy yo/i.test(allText)) bookingFor = 'para mí mismo';
        if (/hijo|hija|familiar|alumno|otra persona/i.test(allText)) bookingFor = 'para otra persona';

        let academicLevel: string | null = null;
        if (/primaria/i.test(allText)) academicLevel = 'Primaria';
        else if (/secundaria/i.test(allText)) academicLevel = 'Secundaria';
        else if (/preparatoria|prepas|bachillerato/i.test(allText)) academicLevel = 'Preparatoria';
        else if (/universidad|universitario|carrera|licenciatura/i.test(allText)) academicLevel = 'Universidad';

        return {
            paraQuien: bookingFor,
            email: emailMatch ? emailMatch[0] : null,
            telefono: phoneMatch ? phoneMatch[0].trim() : null,
            nivelAcademico: academicLevel,
            totalMensajesUsuario: userMessages.length
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

**Extrae y responde SOLO con un JSON válido en este formato exacto:**
{
  "bookingFor": "me",
  "studentFirstName": "Nombre",
  "studentLastName": "Apellido",
  "studentEmail": "email@ejemplo.com",
  "studentPhone": "+521234567890",
  "parentName": null,
  "parentEmail": null,
  "parentPhone": null,
  "academicLevel": "preparatoria",
  "subjects": ["Materia1", "Materia2"],
  "specificTopics": "temas específicos mencionados",
  "currentStruggles": "dificultades mencionadas",
  "learningGoals": "objetivos mencionados"
}

Reglas:
- "bookingFor" debe ser "other" si la asesoría es para un hijo, hija, familiar o alguien más. Debe ser "me" si es para el mismo usuario que escribe.
- Si "bookingFor" es "other", extrae el nombre del padre/tutor en "parentName". Asigna el correo y teléfono de contacto a "parentEmail" y "parentPhone", y deja "studentEmail" y "studentPhone" como null o vacíos si no se especifican por separado.
- "academicLevel" debe ser "primaria", "secundaria", "preparatoria" o "universidad".
- Si un dato no se menciona, usa null o un string vacío "".
`;

        try {
            const textResponse = await this.callGeminiWithRetry([{ role: 'user', parts: [{ text: prompt }] }], 3, 15000, true);
            const jsonStr = this.cleanJson(textResponse);

            if (jsonStr) {
                try {
                    return JSON.parse(jsonStr);
                } catch (e) {
                    console.error('Error parsing extracted data JSON:', e);
                    console.log('Raw response:', textResponse);
                }
            }
        } catch (error) {
            console.error('Error extracting data from chat:', error);
        }

        // Valores por defecto si falla la extracción
        return {
            bookingFor: 'me',
            studentFirstName: 'Cliente',
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
