/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

const RacesPage = lazy(() => import('./pages/RacesPage'))
const RaceDetailPage = lazy(() => import('./pages/RaceDetailPage'))
const AskPage = lazy(() => import('./pages/AskPage'))

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/races" replace /> },
  { path: '/races', element: <RacesPage /> },
  { path: '/races/:id', element: <RaceDetailPage /> },
  { path: '/ask', element: <AskPage /> },
])