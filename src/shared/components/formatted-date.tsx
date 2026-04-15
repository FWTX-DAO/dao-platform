"use client";

import { useEffect, useState } from "react";

type Props = {
  secsSinceEpoch: number;
};

export default function FormattedDate({ secsSinceEpoch }: Props) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    setFormattedDate(
      new Date(secsSinceEpoch * 1000).toLocaleDateString("en-us", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    );
  }, [secsSinceEpoch]);

  return <p suppressHydrationWarning>{formattedDate}</p>;
}
