# Telegram Bot Design for EduGestion3.0

Based on the project's features (Students, Bookings, Payments), here is a proposed command structure for the Telegram Bot.

## User Persona
**Teacher/Administrator**: Needs quick access to schedule, student info, and financial overview without opening the full web app.

## Core Commands

### 🏠 General
| Command | Description |
| :--- | :--- |
| `/start` | Welcome message and main menu buttons. |
| `/help` | Shows list of available commands. |
| `/dashboard` | Daily summary: Classes today, Income today, New students. |

### 📅 Schedule (Agenda)
| Command | Description |
| :--- | :--- |
| `/agenda` | List of classes/appointments for **today**. |
| `/manana` | List of classes for **tomorrow**. |
| `/proxima` | Details of the **next upcoming class** (Time, Student, Subject). |
| `/semana` | Summary of the current week's schedule. |

### 🎓 Students (Alumnos)
| Command | Description |
| :--- | :--- |
| `/alumnos` | Lists all active students (paginated if many). |
| `/buscar [nombre]` | Search for a specific student by name. Returns contact info & status. |
| `/nuevo_alumno` | Returns a **link** to the web app's "New Student" form (complex forms are better on web). |

### 💰 Finance (Pagos)
| Command | Description |
| :--- | :--- |
| `/ingresos` | Total revenue for the current month. |
| `/balance` | Current available balance for withdrawal. |
| `/historial` | Last 5 transactions/payments received. |

## Automated Notifications (Webhooks)
The bot can also proactively notify you of events:
-   **New Booking**: "📅 New class booked: [Student] on [Date] at [Time]"
-   **Payment Received**: "💰 Payment received: $[Amount] from [Student]"
-   **New Student**: "🎓 New student registered: [Name]"

## Implementation Logic (n8n)
1.  **Command Trigger**: Use `Telegram Trigger` node for commands.
2.  **Database Lookup**: Use `Supabase` node to query `students`, `appointments`, `payments` tables.
3.  **Response**: Use `Telegram` node to send formatted text back.

### Example: `/agenda` Flow
1.  **Trigger**: Message text = `/agenda`
2.  **Supabase**: `SELECT * FROM appointments WHERE date = CURRENT_DATE`
3.  **Format**: Loop through results and build a list string.
4.  **Reply**: "📅 **Clases de Hoy:**\n10:00 AM - Juan Pérez (Matemáticas)\n12:00 PM - María López (Física)"
