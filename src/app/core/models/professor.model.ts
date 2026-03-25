export interface Professor {
    id: string;
    user_id: string; // The ID of the academy owner
    auth_user_id?: string; // The ID of the professor's own auth login (if implemented)
    name: string;
    specialty?: string;
    bio?: string;
    avatar_url?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    services?: ServiceProfessor[]; // To hold the assigned services
}

export interface ServiceProfessor {
    service_id: string;
    professor_id: string;
}
