import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientesLista from './pages/clientes/ClientesLista';
import ClienteDetalle from './pages/clientes/ClienteDetalle';
import Inventario from './pages/inventario/Inventario';
import OrdenesLista from './pages/ordenes/OrdenesLista';
import NuevaOrden from './pages/ordenes/NuevaOrden';
import OrdenDetalle from './pages/ordenes/OrdenDetalle';
import CotizacionesLista from './pages/cotizaciones/CotizacionesLista';
import NuevaCotizacion from './pages/cotizaciones/NuevaCotizacion';
import CotizacionDetalle from './pages/cotizaciones/CotizacionDetalle';
import RevisionesLista from './pages/revisiones/RevisionesLista';
import NuevaRevision from './pages/revisiones/NuevaRevision';
import RevisionDetalle from './pages/revisiones/RevisionDetalle';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminConfiguracion from './pages/admin/AdminConfiguracion';
import Setup from './pages/Setup';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              {/*<Route path="/setup" element={<Setup />} />*/}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="clientes" element={<ClientesLista />} />
                <Route path="clientes/:id" element={<ClienteDetalle />} />
                <Route path="inventario" element={<Inventario />} />
                <Route path="ordenes" element={<OrdenesLista />} />
                <Route path="ordenes/nueva" element={<NuevaOrden />} />
                <Route path="ordenes/:id" element={<OrdenDetalle />} />
                <Route path="cotizaciones" element={<CotizacionesLista />} />
                <Route path="cotizaciones/nueva" element={<NuevaCotizacion />} />
                <Route path="cotizaciones/:id" element={<CotizacionDetalle />} />
                <Route path="revisiones" element={<RevisionesLista />} />
                <Route path="revisiones/nueva" element={<NuevaRevision />} />
                <Route path="revisiones/:id" element={<RevisionDetalle />} />
                <Route path="admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsuarios /></ProtectedRoute>} />
                <Route path="admin/configuracion" element={<ProtectedRoute requireAdmin><AdminConfiguracion /></ProtectedRoute>} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
