import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { token } = await req.json();

        if (!token) {
            throw new Error("Token is required");
        }

        const supabase = createClient(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get token data
        const { data: tokenData, error: tokenError } = await supabase
            .from("student_access_tokens")
            .select("*")
            .eq("token", token)
            .single();

        if (tokenError || !tokenData) {
            return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // 2. Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
            return new Response(JSON.stringify({ error: "Token expired" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // 3. Get Student Data using the email from the token
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("*")
            .eq("email", tokenData.student_email)
            .single();

        if (studentError || !student) {
            return new Response(JSON.stringify({ error: "Student not found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
            });
        }

        // 4. Delete token to prevent reuse
        await supabase
            .from("student_access_tokens")
            .delete()
            .eq("id", tokenData.id);

        // 5. Fetch additional data (Feedback & Materials)
        // We can just return the student, and let the frontend use the access_token to fetch the rest?
        // Or return everything here. Let's return everything to be efficient.

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
