# Aura Finance

Aplicación web de finanzas personales para llevar el control de un presupuesto mensual, registrar gastos e ingresos, organizarlos por categorías y visualizar estadísticas reales sobre los hábitos de gasto.

## Estado del proyecto

**MVP funcional en desarrollo.** El backend y el frontend están conectados y operativos sobre datos reales en PostgreSQL, pero el proyecto no está desplegado ni preparado para producción ni para múltiples usuarios.

## Funcionalidades actuales

- **Dashboard**: resumen del mes seleccionado (presupuesto, gastado, ingresos, restante, % utilizado, límite diario orientativo), gasto por categoría y movimientos recientes.
- **Presupuesto mensual**: consulta y edición directamente desde el Dashboard (también accesible en `/budget`, ruta interna sin enlace en el menú principal).
- **Gastos e ingresos**: alta, edición y borrado de movimientos, diferenciados por tipo (gasto/ingreso).
- **Categorías**: gestión (crear/eliminar) mediante un modal, reutilizado desde la pantalla de Gastos.
- **Estadísticas**: métricas del periodo (media diaria, día y categoría de mayor gasto, ritmo de gasto respecto al mes transcurrido, comparación con el mes anterior), distribución del gasto por categoría y evolución diaria/acumulada del gasto.
- **Gráficos**: gráfico de anillo (donut) y gráfico de línea, implementados en SVG propio sin librerías externas.
- **Selector de mes/año**: estado global compartido entre Dashboard, Presupuesto, Gastos y Estadísticas.
- **Interfaz responsive**: adaptada a escritorio, tablet y móvil.
- **API REST** con validaciones y manejo de errores centralizado.

## Arquitectura

```
Frontend (Angular)  --HTTP/JSON-->  Backend (Spring Boot)  --JDBC-->  PostgreSQL
```

**Frontend:** Angular (standalone components + signals) consume la API REST vía `HttpClient`. No hay lógica de negocio relevante en la capa de presentación: los cálculos financieros importantes los realiza el backend.

**Backend**, en capas:

```
Controller  →  Service  →  Repository  →  PostgreSQL
   (REST)      (negocio)     (JPA)
```

Entre la API y las entidades JPA se usan **DTOs** (`record` de Java) tanto de entrada (`*Request`) como de salida (`*Response`): las entidades nunca se serializan directamente hacia el frontend.

## Tecnologías

**Backend**
- Java 21
- Spring Boot 4.1.1 (Web MVC, Spring Data JPA, Validation)
- Hibernate (JPA)
- PostgreSQL
- Maven (con Maven Wrapper)
- Lombok

**Frontend**
- Angular 22 (standalone components, signals)
- TypeScript 6
- Tailwind CSS 4
- RxJS

## Requisitos

- Java 21
- Node.js 24 y npm 11 (o versiones compatibles con Angular 22)
- PostgreSQL en ejecución (local o remoto)

## Configuración

El backend lee la conexión a PostgreSQL desde variables de entorno; **no hay ninguna credencial en el repositorio**.

| Variable      | Descripción                    | Valor por defecto                                  |
|---------------|---------------------------------|-----------------------------------------------------|
| `DB_URL`      | URL JDBC de la base de datos    | `jdbc:postgresql://localhost:5432/aura_finance`     |
| `DB_USERNAME` | Usuario de PostgreSQL           | `postgres`                                           |
| `DB_PASSWORD` | Contraseña de PostgreSQL        | *(obligatoria, sin valor por defecto)*              |

`DB_PASSWORD` es obligatoria: si no se define, el arranque del backend falla. Puede definirse, por ejemplo:

```bash
export DB_PASSWORD=tu_contraseña_local
```

o configurarse como variable de entorno en la configuración de ejecución de tu IDE.

## Ejecución

**Backend** (desde la raíz del proyecto):

```bash
./mvnw spring-boot:run
```

**Frontend** (desde `frontend/`):

```bash
npm install
npm start
```

**Puertos por defecto:**
- Backend: `8080`
- Frontend: `4200`
- PostgreSQL: `5432`

## API

Endpoints principales expuestos por el backend (`/api/**`):

| Método | Endpoint                     | Descripción                                  |
|--------|-------------------------------|-----------------------------------------------|
| GET    | `/api/budgets`                | Lista todos los presupuestos                  |
| GET    | `/api/budgets/current`        | Presupuesto del mes en curso                  |
| GET    | `/api/budgets/summary`        | Resumen calculado (gastado, restante, % usado) de un periodo |
| POST   | `/api/budgets`                | Crea un presupuesto                           |
| PUT    | `/api/budgets/{id}`           | Actualiza un presupuesto                      |
| GET    | `/api/expenses`                | Lista movimientos (filtros por mes/año/categoría) |
| GET    | `/api/expenses/{id}`          | Obtiene un movimiento                         |
| POST   | `/api/expenses`               | Crea un movimiento (gasto o ingreso)          |
| PUT    | `/api/expenses/{id}`          | Actualiza un movimiento                       |
| DELETE | `/api/expenses/{id}`          | Elimina un movimiento                         |
| GET    | `/api/categories`             | Lista categorías                              |
| POST   | `/api/categories`              | Crea una categoría                            |
| DELETE | `/api/categories/{id}`        | Elimina una categoría (si no tiene gastos asociados) |
| GET    | `/api/statistics`              | Estadísticas completas de un periodo (mes/año) |

## Estructura del proyecto

```
Aura-finance/
├── src/main/java/com/aura/finance/
│   ├── controller/     # Endpoints REST
│   ├── service/        # Lógica de negocio
│   ├── repository/     # Spring Data JPA
│   ├── entity/         # Entidades JPA (Budget, Category, Expense, MovementType)
│   ├── dto/             # DTOs de entrada/salida (budget, category, expense, statistics)
│   ├── exception/       # Excepciones de negocio + manejador global
│   └── config/          # Configuración (CORS, etc.)
├── src/main/resources/
│   └── application.yaml # Configuración (sin credenciales, vía variables de entorno)
├── src/test/            # Tests del backend
├── frontend/
│   └── src/app/
│       ├── core/         # Modelos, servicios HTTP, estado (PeriodStore)
│       ├── features/     # Dashboard, Gastos, Presupuesto, Estadísticas, Objetivos (placeholder)
│       └── shared/       # Componentes de UI reutilizables (layout, tarjetas, gráficos, formularios)
└── pom.xml
```

## Roadmap

Trabajo futuro considerado, **no implementado todavía**:

- Contenerización con Docker
- Autenticación y multiusuario
- Despliegue en un entorno de producción
- Funcionalidades basadas en IA
- Aplicación móvil
- Objetivos de ahorro / gamificación

## Autor

Omar — Aura Finance

Repositorio: [https://github.com/OmarDZC/AuraFinance](https://github.com/OmarDZC/AuraFinance)
