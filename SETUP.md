# EduGestión - Guía de Configuración

## 1. Instalación de Dependencias

```bash
npm install
```

## 2. Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL en `database/schema.sql` en el SQL Editor de Supabase
3. Configura las variables de entorno en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseAnonKey: 'tu-anon-key'
};
```

## 3. Configuración de Autenticación

En Supabase Dashboard:
- Ve a Authentication > Settings
- Configura las URLs de redirección
- Habilita el proveedor de Email

## 4. Configuración de RLS (Row Level Security)

Las políticas RLS ya están incluidas en el schema SQL. Asegúrate de que estén habilitadas.

## 5. Ejecutar el Proyecto

```bash
ng serve
```

## 6. Estructura de Rutas

- `/` - Landing page pública
- `/auth/register` - Registro de usuarios
- `/auth/pricing` - Selección de plan
- `/auth/checkout` - Checkout (simulado)
- `/dashboard` - Dashboard principal
- `/dashboard/onboarding` - Wizard de onboarding
- `/dashboard/landing-editor` - Editor de landing page
- `/p/:slug` - Landing pages públicas de usuarios

## 7. Flujo de Usuario

1. Usuario visita landing page
2. Se registra y selecciona plan
3. Completa onboarding (datos personales)
4. Accede al dashboard con tareas gamificadas
5. Configura su landing page personalizada
6. Crea servicios y gestiona alumnos

## 8. Próximos Pasos

- Implementar componentes faltantes (login, checkout, etc.)
- Integrar Stripe para pagos reales
- Añadir funcionalidad de subida de archivos
- Implementar sistema de notificaciones
- Crear módulos de gestión de alumnos y citas