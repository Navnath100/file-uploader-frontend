import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Files from './screens/Files/Files';
import Login from './screens/Login/Login';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/files" element={<Files />} />
      </Routes>
    </BrowserRouter>
  );
}
