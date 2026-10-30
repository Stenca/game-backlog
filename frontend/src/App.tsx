import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import GameDetail from "./routes/GameDetail";
import Games from "./routes/Games";
import Landing from "./routes/Landing";
import Login from "./routes/Login";
import Profile from "./routes/Profile";
import Register from "./routes/Register";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:id" element={<GameDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
