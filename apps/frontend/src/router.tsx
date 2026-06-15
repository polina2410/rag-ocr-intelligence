/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouteFallback } from './components/RouteFallback'

const RacesPage = lazy(() => import('./pages/RacesPage'))
const RaceDetailPage = lazy(() => import('./pages/RaceDetailPage'))
const AskPage = lazy(() => import('./pages/AskPage'))

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/races" replace /> },
  { path: '/races', element: <Suspense fallback={<RouteFallback />}><RacesPage /></Suspense> },
  { path: '/races/:id', element: <Suspense fallback={<RouteFallback />}><RaceDetailPage /></Suspense> },
  { path: '/ask', element: <Suspense fallback={<RouteFallback />}><AskPage /></Suspense> },
])