import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getConfig } from '../../firebase/firestore';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/inventario': 'Inventario',
  '/ordenes': 'Órdenes de Trabajo',
  '/ordenes/nueva': 'Nueva Orden',
  '/cotizaciones': 'Cotizaciones',
  '/cotizaciones/nueva': 'Nueva Cotización',
  '/revisiones': 'Revisiones de Vehículo',
  '/revisiones/nueva': 'Nueva Revisión',
  '/admin/usuarios': 'Gestión de Usuarios',
  '/admin/configuracion': 'Configuración',
};

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appConfig, setAppConfig] = useState({ logoUrl: null, companyName: 'Auto Servicios Monterroso' });
  const location = useLocation();

  useEffect(() => {
    getConfig('appearance').then(data => {
      if (data) setAppConfig({ logoUrl: data.logoUrl, companyName: data.companyName });
    });
  }, []);

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || 'Taller ASM';

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        logoUrl={appConfig.logoUrl}
        companyName={appConfig.companyName}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          collapsed={collapsed}
          pageTitle={pageTitle}
          onMobileMenuToggle={() => setMobileOpen(o => !o)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
