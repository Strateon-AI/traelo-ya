"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "¿Cuánto tarda el envío desde Estados Unidos?",
    answer:
      "Entre 7 y 10 días hábiles desde que el producto llega a nuestro almacén en Estados Unidos hasta que lo recibes en Bolivia.",
  },
  {
    question: "¿Qué pasa si el paquete pesa más de lo cotizado?",
    answer:
      "El costo final se ajusta según el peso real y el peso volumétrico verificado en nuestro almacén. Siempre te lo confirmamos por WhatsApp antes de despachar tu pedido.",
  },
  {
    question: "¿Puedo pagar con mi propia tarjeta en la tienda de Estados Unidos?",
    answer:
      "Sí. Con la opción \"Con tu tarjeta\" vos hacés la compra directamente y nosotros nos encargamos del envío, sin cobrar comisión de compra.",
  },
  {
    question: "¿Hacen entregas en todo Bolivia?",
    answer: "Sí, llegamos a todo el país. El costo de entrega puede variar según la ciudad.",
  },
  {
    question: "¿Cómo coordino el pago de mi pedido?",
    answer:
      "Una vez que confirmamos tu cotización, coordinamos la forma de pago y la entrega directamente por WhatsApp.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="preguntas-frecuentes" className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          Preguntas frecuentes
        </h2>

        <div className="mt-10 divide-y divide-surface-200 rounded-3xl border border-surface-200 bg-white">
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                  className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4.5 text-left sm:px-6"
                >
                  <span className="text-sm font-semibold text-navy-900 sm:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-navy-400 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="px-5 pb-4.5 sm:px-6">
                    <p className="text-sm leading-relaxed text-navy-600">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
