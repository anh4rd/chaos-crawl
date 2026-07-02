import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export function usePubs() {
  const [pubs, setPubs] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("pubs")
        .select("*")
        .order("sort_order");

      setPubs(data ?? []);
    }

    load();
  }, []);

  return pubs;
}