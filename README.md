# Sistema de Gestión - Auto Servicios Monterroso (Taller ASM)

Este es el repositorio de la aplicación web del taller mecánico **Auto Servicios Monterroso (ASM)**, diseñada para la administración y control de clientes, vehículos, inventarios, cotizaciones, órdenes de trabajo y revisiones.

La aplicación es una Single Page Application (SPA) responsiva y moderna construida con **React y Vite**, totalmente integrada con la nube de **Firebase** (Authentication y Firestore Database).

---

## 🚀 Arquitectura y Tecnologías

El proyecto utiliza el siguiente stack de desarrollo:
* **Frontend:** React 18, React Router v7, React Hook Form (para formularios eficientes) y Vite como empaquetador de producción.
* **Estilos:** CSS Vanilla estructurado con variables dinámicas (`:root`) para soportar cambio de temas en tiempo real.
* **Base de Datos y Seguridad:** Firebase Firestore (Base de datos NoSQL) con reglas de seguridad granulares.
* **Autenticación:** Firebase Authentication (proveedor de Correo/Contraseña) con sistema de roles persistentes.
* **Generación de Reportes:** `jsPDF` y `jspdf-autotable` con diseño formal personalizado para exportación de PDFs.
* **Manejo de Fechas:** `date-fns` localizado al español.

---

## 🛠️ Estructura del Proyecto

```text
├── .firebaserc                # Configuración del ID del proyecto de Firebase (taller-asm)
├── firebase.json              # Configuración de despliegue de Hosting y reglas de Firestore
├── firestore.rules            # Reglas de seguridad para acceso a base de datos Firestore
├── firestore.indexes.json     # Declaración de índices para consultas Firestore
├── package.json               # Dependencias del proyecto y scripts npm
├── vite.config.js             # Configuración del compilador Vite
├── scripts/
│   └── createAdmin.mjs        # Script de inicialización de base de datos y usuario admin en Node
├── src/
│   ├── assets/                # Recursos estáticos (Logotipo predeterminado, react.svg)
│   ├── components/            # Componentes reutilizables
│   │   ├── auth/              # HOCs de protección de rutas y permisos (ProtectedRoute)
│   │   ├── layout/            # Estructura del sitio (Sidebar, Header, Layout principal)
│   │   ├── shared/            # Selectores de clientes, vehículos y repuestos
│   │   └── ui/                # Modales y elementos UI comunes
│   ├── context/               # Proveedores de estado global (Autenticación, Temas, Toasts)
│   ├── firebase/              # Inicialización y conectores del SDK de Firebase
│   │   ├── config.js          # Credenciales del cliente de Firebase
│   │   ├── auth.js            # Funciones de login, registro y contraseñas
│   │   ├── firestore.js       # Operaciones CRUD optimizadas para Firestore
│   │   └── storage.js         # Utilidad para conversión de archivos a base de datos (Base64)
│   ├── pages/                 # Vistas principales de la aplicación por módulos
│   ├── utils/
│   │   └── pdf/               # Generadores de reportes PDF estructurados por tipo
│   ├── index.css              # Estilos CSS globales, temas y adaptabilidad responsiva
│   └── main.jsx               # Punto de entrada de la aplicación de React
```

---

## ✨ Características Principales

### 1. Panel de Administración y Configuración
* **Temas en tiempo real:** Los usuarios administradores pueden cambiar la paleta de colores de toda la aplicación desde el panel de configuración. Los temas soportados son:
  * **Steel Dark** (Azul Acero Oscuro - Predeterminado)
  * **Carbon & Fire** (Negro y Rojo Fuego)
  * **Midnight Garage** (Gris Oscuro y Esmeralda)
  * **Classic Light** (Fondo Claro, interfaz limpia y Azul Real)
* **Logotipo dinámico e híbrido:**
  * Permite subir un logo personalizado en formato de imagen desde la app. Se convierte automáticamente a **Base64** para almacenarlo en Firestore, evitando problemas de CORS y configuraciones complejas en Storage.
  * Cuenta con un **Fallback local** a `src/assets/logo-default.png` si no se ha configurado un logo personalizado.
  * Incluye una opción de **Restaurar por defecto** para remover la sobreescritura de base de datos.
* **Datos del Taller:** Edición dinámica del nombre, ocupación, dirección, teléfono y razón social que aparecen automáticamente en los PDFs.

### 2. Control de Clientes y Vehículos (Responsive 100%)
* Permite crear clientes con NIT y teléfono y asociarles múltiples vehículos (Marca, Línea, Modelo, Placa, Color, Chasis).
* **Tablas apilables (.responsive-table):** En pantallas grandes se renderiza como tabla y en pantallas <= 768px (móviles y tablets en vertical) se transforma automáticamente en un listado de tarjetas ordenadas.

### 3. Documentos y Operaciones
* **Cotizaciones:** Registro de servicios y repuestos con cálculo automático de totales e IVA. Generación de PDF.
* **Órdenes de Trabajo:** Control de ingreso de kilometraje, combustible, falla reportada, trabajo realizado, repuestos y mano de obra con estados (*Pendiente, En Proceso, Terminado*).
* **Revisiones de Vehículo:** Inspección general del auto y observaciones.

### 4. Generador de PDFs Formal
* Los PDFs utilizan un diseño formal con colores corporativos basados en **Azul Marino** y **Slate** para bordes y encabezados.
* Contienen el logotipo (predeterminado o cargado por base de datos), datos del taller, resumen del vehículo y espacio de firmas.

---

## 🎨 Sistema de Temas Dinámicos (CSS Variables)

El cambio estético se apoya en variables CSS compartidas. Cada vez que se cambia de tema, el proveedor `ThemeContext` actualiza las propiedades del elemento `:root` del navegador:

```css
:root {
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-surface-2: #263347;
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-text: #E2E8F0;
  --color-text-muted: #94A3B8;
  --color-border: rgba(255, 255, 255, 0.08);
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}
```

---

## 📱 Diseño Responsivo y Tablet/iPad

El diseño está optimizado para dispositivos móviles y tabletas de gran tamaño (breakpoint a **1024px**):
* En pantallas menores o iguales a 1024px (iPad Pro, iPad Portrait y celulares), el menú lateral colapsa y se oculta.
* Se despliega un botón **menú hamburguesa (SVG)** en la barra de navegación para abrir el sidebar como un cajón deslizante (*drawer*).
* Los formularios con rejillas de 2 y 3 columnas colapsan automáticamente a una sola columna para facilitar el uso táctil en el taller.

---

## 🔒 Reglas de Seguridad de Firestore

El archivo `firestore.rules` protege la información confidencial restringiendo accesos anónimos. Solo la información de apariencia y del taller (colección `config`) es de lectura libre:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lectura pública para cargar logo, colores y datos de la empresa sin login previo
    match /config/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Todas las demás colecciones (clientes, vehículos, órdenes, cotizaciones) requieren inicio de sesión obligatorio
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /clientes/{clienteId} {
      allow read, write: if request.auth != null;
      match /vehiculos/{vehiculoId} {
        allow read, write: if request.auth != null;
      }
    }
    match /inventario/{itemId} { allow read, write: if request.auth != null; }
    match /ordenes/{ordenId} { allow read, write: if request.auth != null; }
    match /cotizaciones/{cotizacionId} { allow read, write: if request.auth != null; }
    match /revisiones/{revisionId} { allow read, write: if request.auth != null; }
  }
}
```

---

## 💻 Desarrollo Local e Inicialización

### Prerrequisitos
* Node.js (v18 o superior)
* Firebase CLI instalado globalmente (`npm install -g firebase-tools`)
* Proyecto en la consola de Firebase con **Email/Password** habilitado como proveedor en Authentication.

### Pasos
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar entorno de desarrollo local:
   ```bash
   npm run dev
   ```
4. **Configuración Inicial (Admin):**
   Para registrar el primer usuario y sembrar las configuraciones base en la base de datos de la nube, tienes dos opciones:
   * **Opción A (Recomendada):** Inicia la app y visita la ruta `http://localhost:5173/setup`. Presiona el botón "Inicializar Sistema".
   * **Opción B:** Desde la consola de comandos corre:
     ```bash
     node --experimental-vm-modules scripts/createAdmin.mjs
     ```
    * *Credenciales del Admin inicial:* Las credenciales predeterminadas se configuran al correr el script de inicialización o mediante la pantalla de configuración. (Asegúrese de cambiar la contraseña predeterminada inmediatamente después del primer inicio de sesión).

---

## 🚀 Despliegue en Producción (Firebase Cloud)

Para compilar y subir los archivos a la nube de Firebase, ejecuta:

1. **Compilar para producción:**
   ```bash
   npm run build
   ```
2. **Desplegar a Firebase:**
   ```bash
   firebase deploy
   ```
   *(Este comando lee el archivo `firebase.json` y sube las reglas de Firestore, la estructura de índices y los archivos estáticos de la carpeta `dist` al CDN).*
