import Header from "@/components/layout/Header";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import GameDetail from "./routes/GameDetail";
import Games from "./routes/Games";
import Landing from "./routes/Landing";
import Login from "./routes/Login";
import Register from "./routes/Register";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";
import NotFound from "@/routes/NotFound";
import UserProfile from "@/routes/UserProfile";

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:id" element={<GameDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
