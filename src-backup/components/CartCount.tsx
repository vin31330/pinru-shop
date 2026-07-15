"use client";

import { useEffect, useState } from "react";
import { loadCart } from "@/lib/cart";

export default function CartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const total = loadCart().reduce((sum, item) => sum + item.quantity, 0);
      setCount(total);
    };

    update();
    window.addEventListener("pinru-cart-updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("pinru-cart-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
      {count}
    </span>
  );
}
