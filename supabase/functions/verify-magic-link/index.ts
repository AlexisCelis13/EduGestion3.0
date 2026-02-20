import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { verify } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

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
        const { token } = await req.json();

        if (!token) {
            throw new Error("Token is required");
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not set");
        }

        // 1. Verify JWT
        const key = await getCryptoKey(JWT_SECRET);
        let payload;
        try {
            payload = await verify(token, key);
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        const email = payload.email as string;

        if (!email) {
            return new Response(JSON.stringify({ error: "Invalid token structure" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        const supabase = createClient(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Get Student Data using the email from the token
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("*")
            .eq("email", email)
            .single();

        if (studentError || !student) {
            return new Response(JSON.stringify({ error: "Student not found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
            });
        }

        // 3. Fetch additional data (Feedback & Materials)
        const { data: feedback } = await supabase
            .from("student_feedback")
            .select("*")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false });

        const { data: materials } = await supabase
            .from("student_materials")
            .select("*")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false });

        return new Response(
            JSON.stringify({
                student,
                feedback: feedback || [],
                materials: materials || [],
            }),
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
