import { Link } from "react-router-dom";
import bonfireImg from "../assets/bonfire.png";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <img
        src={bonfireImg}
        alt=""
        className="mb-6 h-20 w-20 object-contain opacity-50 grayscale"
      />
      <h1 className="text-6xl font-bold tracking-tight text-ink">404</h1>
      <p className="mt-2 text-lg text-ink-muted">
        You've wandered into the Abyss. This page does not exist.
      </p>
      <Link to="/games" className="mt-8">
        <Button>Return to the Bonfire</Button>
      </Link>
    </main>
  );
}
