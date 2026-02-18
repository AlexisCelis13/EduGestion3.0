import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
    email: string;
    origin: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set");
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
        // We check against the 'students' table. Adjust this according to your actual schema if needed.
        // Assuming 'email' is a unique field in 'students' table.
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("id, first_name")
            .eq("email", email)
            .single();

        if (studentError || !student) {
            // Return 200 even if email not found to prevent user enumeration, 
            // but log it internally.
            console.error("Student not found or error:", studentError);
            return new Response(
                JSON.stringify({ message: "If the email exists, a link has been sent." }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            );
        }

        // 2. Generate secure token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // 3. Store token
        const { error: tokenError } = await supabase
            .from("student_access_tokens")
            .insert({
                student_email: email,
                token: token,
                expires_at: expiresAt.toISOString(),
            });

        if (tokenError) {
            throw tokenError;
        }

        // 4. Send Email
        const resend = new Resend(RESEND_API_KEY);
        const magicLink = `${origin}/student-portal/${token}`;

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "EduGestión <onboarding@resend.dev>", // TODO: Update with user's domain
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
