'use client'
import { useEffect, useState } from "react";

export default function Page() {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/user")
      .then(res => res.json())
      .then(setUsuario)
      .catch(console.error);
  }, []);

  return <div>{JSON.stringify(usuario)}</div>;
}