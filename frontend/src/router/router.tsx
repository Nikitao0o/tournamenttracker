import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFoundPage />, // Отобразится при неперехваченных ошибках
    children: [
      {
        index: true, // Соответствует ровно маршруту '/'
        element: <HomePage />,
      },
    //   {
    //     path: 'about',
    //     element: <AboutPage />,
    //   },
    //   {
    //     path: '*', // Ловушка для несуществующих путей внутри Layout
    //     element: <NotFoundPage />,
    //   },
    ],
  },
]);