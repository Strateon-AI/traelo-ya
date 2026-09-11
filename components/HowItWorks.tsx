import { ArrowRight, Check, Package, PlaneTakeoff, Search, ShoppingBag } from "lucide-react";

const STEPS = [
  { icon: Search, title: "Cotiza", text: "Envíanos el link o usa nuestro cotizador." },
  { icon: ShoppingBag, title: "Compramos", text: "Por vos o con tu tarjeta en tiendas de EE.UU." },
  { icon: PlaneTakeoff, title: "Enviamos", text: "Tu pedido viaja a Bolivia en 7 a 10 días hábiles." },
  { icon: Package, title: "Recibes", text: "Te lo entregamos en la puerta de tu casa u oficina." },
];

const CHECKLIST = [
  "Compras en las mejores tiendas",
  "Atención personalizada",
  "Seguimiento de tu pedido",
  "Entregas en todo Bolivia",
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
              ¿Cómo funciona?
            </h2>
            <p className="mt-2 text-navy-600">En solo 4 pasos, tus productos en Bolivia.</p>

            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {STEPS.map((step, index) => (
                <div key={step.title} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-100 text-brand-blue-600">
                    <step.icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-navy-900">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{step.text}</p>
                  {index < STEPS.length - 1 && (
                    <ArrowRight className="absolute right-[-24px] top-5 hidden h-5 w-5 text-surface-200 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-surface-50 p-6 sm:p-7">
            <div className="flex items-center gap-2 text-2xl">
              <span aria-hidden="true">🇺🇸</span>
              <PlaneTakeoff className="h-5 w-5 text-navy-500" strokeWidth={2} />
              <span aria-hidden="true">🇧🇴</span>
            </div>
            <h3 className="mt-4 text-lg font-bold leading-snug text-navy-900">
              De Estados Unidos a Bolivia, sin complicaciones
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-navy-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-whatsapp-600/15 text-whatsapp-700">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
