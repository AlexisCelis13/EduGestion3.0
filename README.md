# EduGestión 3.0 - SaaS para Gestión de Academias y Tutores

Sistema de gestión integral para academias y tutores independientes desarrollado con Angular 17+ y Supabase.

## 🚀 Características Principales

- **Gestión de Alumnos**: Organiza información completa de estudiantes
- **Programación de Clases**: Sistema de citas y calendario integrado
- **Pagos Automáticos**: Integración con Stripe para cobros seguros
- **Landing Pages Personalizadas**: Cada tutor tiene su propia página web
- **Dashboard Gamificado**: Interfaz intuitiva con progreso visual
- **Multi-tenant**: Soporte para múltiples academias

## 🛠️ Stack Tecnológico

- **Frontend**: Angular 17+ (Standalone Components, Signals)
- **Estilos**: TailwindCSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Pagos**: Stripe
- **Hosting**: Vercel/Netlify ready

## 💰 Planes de Suscripción (MXN)

- **Freelance**: $199/mes - Hasta 50 alumnos
- **Academia**: $299/mes - Hasta 200 alumnos, múltiples profesores

## 🎯 Flujo de Usuario

1. **Landing Page** → Página promocional moderna
2. **Registro** → Formulario con validación
3. **Selección de Plan** → Pricing con checkout simulado
4. **Onboarding** → Configuración guiada con modales
5. **Dashboard** → Panel gamificado estilo Pulpos.com
6. **Configuración** → Editor de landing page personalizada

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                 # Servicios y guards
│   │   ├── guards/          # Auth y onboarding guards
│   │   └── services/        # Supabase service
│   ├── features/            # Módulos funcionales
│   │   ├── auth/           # Login, registro, pricing
│   │   ├── dashboard/      # Panel principal
│   │   ├── onboarding/     # Wizard de configuración
│   │   ├── services/       # Gestión de servicios
│   │   └── user-landing/   # Landing pages personalizadas
│   ├── layouts/            # Layouts de la aplicación
│   └── shared/             # Componentes compartidos
├── database/               # Scripts SQL de Supabase
└── environments/          # Configuración de entornos
```

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/AlexisCelis13/EduGestion3.0.git
cd EduGestion3.0
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase
1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar el script SQL en `database/update_schema.sql`
3. Configurar variables en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseAnonKey: 'tu-anon-key'
};
```

### 4. Ejecutar el proyecto
```bash
ng serve
```

El proyecto estará disponible en `http://localhost:5500`

## 🗄️ Base de Datos

### Tablas Principales
- `profiles` - Perfiles de usuario vinculados a auth.users
- `tenant_settings` - Configuración de landing pages
- `services` - Servicios/materias ofrecidas
- `students` - Información de alumnos
- `appointments` - Citas programadas
- `payments` - Gestión de pagos
- `onboarding_progress` - Progreso de configuración

### Configuración RLS
- Row Level Security habilitado en todas las tablas
- Políticas configuradas para multi-tenant
- Acceso público solo para landing pages activas

## 🎨 Diseño

- **Estilo**: Minimalista, inspirado en Pulpos.com
- **Sidebar**: Oscuro con iconos blancos
- **Cards**: Blancas con sombras suaves
- **Responsive**: Optimizado para móvil y desktop
- **Gamificación**: Barras de progreso y tareas completables

## 🔐 Autenticación y Seguridad

- Autenticación con Supabase Auth
- Guards para rutas protegidas
- RLS para seguridad a nivel de base de datos
- Validación de formularios con Angular Reactive Forms

## 📱 Funcionalidades Implementadas

### ✅ Completadas
- [x] Landing page promocional
- [x] Sistema de registro y login
- [x] Selección de planes de suscripción
- [x] Checkout simulado con Paypal
- [x] Onboarding wizard con modales
- [x] Dashboard gamificado
- [x] Editor de landing page personalizada
- [x] Gestión básica de servicios
- [x] Landing pages públicas dinámicas

### 🚧 En Desarrollo
- [ ] Gestión completa de alumnos
- [ ] Sistema de citas y calendario
- [ ] Integración real con PayPal
- [ ] Reportes y estadísticas
- [ ] Notificaciones push
- [ ] Sistema de mensajería

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Alexis Celis** - [GitHub](https://github.com/AlexisCelis13)

## 🙏 Agradecimientos

- Angular Team por Angular 17+
- Supabase por la infraestructura backend
- TailwindCSS por el sistema de estilos
- Comunidad open source

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!
