import React from 'react';
import { Link, Outlet} from 'react-router-dom';

export const MainLayout: React.FC = () => {
    return(
        <div>
            <header>
        <nav style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
          <Link to="/">Главная</Link>
          <Link to="/about">О нас</Link>
        </nav>
      </header>
      <hr />
      <main>
        {/* Outlet рендерит активный дочерний маршрут */}
        <Outlet />
      </main>
        </div>
    )
}