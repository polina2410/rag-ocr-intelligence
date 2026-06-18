/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from './components/RootLayout'

const RacesPage = lazy(() => import('./pages/RacesPage'))
const RaceDetailPage = lazy(() => import('./pages/RaceDetailPage'))
const AskPage = lazy(() => import('./pages/AskPage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/races" replace /> },
  {
    element: <RootLayout />,
    children: [
      { path: '/races', element: <RacesPage /> },
      { path: '/races/:id', element: <RaceDetailPage /> },
      { path: '/ask', element: <AskPage /> },
      { path: '/upload', element: <UploadPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])