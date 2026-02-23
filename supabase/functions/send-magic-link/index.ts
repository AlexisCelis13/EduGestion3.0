import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
    email: string;
    origin: string;
}

// Helper to create crypto key for JWT
async function getCryptoKey(secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    return await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set");
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET (SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY) is not set");
        }

        const { email, origin } = await req.json() as RequestData;

        if (!email || !origin) {
            throw new Error("Email and origin are required");
        }

        const supabase = createClient(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Verify student exists
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("id, first_name")
            .eq("email", email)
            .maybeSingle();

        if (studentError || !student) {
            // Return 200 even if email not found to prevent enumeration
            console.error("Student not found or error:", studentError);
            return new Response(
                JSON.stringify({ message: "If the email exists, a link has been sent." }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            );
        }

        // 2. Generate signed JWT token
        const key = await getCryptoKey(JWT_SECRET);
        const jwt = await create(
            { alg: "HS256", typ: "JWT" },
            {
                email: email,
                student_id: student.id,
                role: 'student_magic_link',
                exp: getNumericDate(15 * 60) // 15 minutes
            },
            key
        );

        // 3. Send Email
        const resend = new Resend(RESEND_API_KEY);
        // Encode token to be URL safe just in case, though JWTs are URL safe by spec usually
        const magicLink = `${origin}/student-portal/${jwt}`;

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "EduGestión <onboarding@resend.dev>",
            to: [email],
            subject: "Acceso a tu Portal de Alumno",
            html: `
        <h1>Hola, ${student.first_name || 'Alumno'}!</h1>
        <p>Has solicitado acceso a tu portal de estudiante.</p>
        <p>Haz clic en el siguiente enlace para entrar:</p>
        <a href="${magicLink}" style="padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; display: inline-block;">
          Entrar al Portal
        </a>
        <p>Este enlace expirará en 15 minutos.</p>
        <p>Si no solicitaste este acceso, puedes ignorar este correo.</p>
      `,
        });

        if (emailError) {
            console.error("Resend Error:", emailError);
            throw emailError;
        }

        return new Response(
            JSON.stringify({ message: "Magic link sent successfully" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
