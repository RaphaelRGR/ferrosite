"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

/** Demonstração interativa do Dialog (abre/fecha, Escape, retorno de foco). */
export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Abrir diálogo
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Exemplo de diálogo"
        description="Foco preso, Escape fecha e o foco volta ao botão que abriu."
      >
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <Input label="Nome" placeholder="Exemplo" required />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
