import { Routes, Route, Navigate } from 'react-router-dom'
import SetsList from './pages/SetsList.jsx'
import SetEditor from './pages/SetEditor.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SetsList />} />
      <Route path="/set/:id" element={<SetEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
